/**
 * adbClient.js — WebUSB-based ADB protocol client
 * Connects to Android devices via USB from the browser, executes shell commands,
 * and provides device management capabilities.
 * 
 * Requires Chrome/Edge/Brave (WebUSB support).
 * Device must have USB Debugging enabled in Developer Options.
 */

// ─── ADB PROTOCOL CONSTANTS ───
const ADB_CLASS = 0xFF;
const ADB_SUBCLASS = 0x42;
const ADB_PROTOCOL = 0x01;

// ADB command IDs (little-endian)
const A_SYNC = 0x434e5953; // 'SYNC'
const A_CNXN = 0x4e584e43; // 'CNXN' — connection
const A_AUTH = 0x48545541; // 'AUTH' — authentication
const A_OPEN = 0x4e45504f; // 'OPEN' — open stream
const A_OKAY = 0x59414b4f; // 'OKAY' — success
const A_CLSE = 0x45534c43; // 'CLSE' — close stream
const A_WRTE = 0x45545257; // 'WRTE' — write data

const ADB_VERSION = 0x01000000; // ADB protocol version 1.0
const MAX_PAYLOAD = 4096;

// Auth types
const AUTH_TOKEN = 1;
const AUTH_SIGNATURE = 2;
const AUTH_RSAPUBLICKEY = 3;

// ─── HELPERS ───

function encodeString(str) {
  return new TextEncoder().encode(str);
}

function decodeString(buffer) {
  return new TextDecoder().decode(buffer);
}

/**
 * Build an ADB protocol message
 */
function buildMessage(command, arg0, arg1, data = new Uint8Array(0)) {
  const header = new ArrayBuffer(24);
  const view = new DataView(header);

  view.setUint32(0, command, true);
  view.setUint32(4, arg0, true);
  view.setUint32(8, arg1, true);
  view.setUint32(12, data.length, true);

  // Compute data checksum
  let checksum = 0;
  for (let i = 0; i < data.length; i++) {
    checksum += data[i];
  }
  view.setUint32(16, checksum & 0xFFFFFFFF, true);

  // Magic = command ^ 0xFFFFFFFF
  view.setUint32(20, (command ^ 0xFFFFFFFF) >>> 0, true);

  return { header: new Uint8Array(header), data };
}

/**
 * Parse an ADB message header from raw bytes
 */
function parseMessage(headerBytes) {
  const view = new DataView(headerBytes.buffer || headerBytes);
  return {
    command: view.getUint32(0, true),
    arg0: view.getUint32(4, true),
    arg1: view.getUint32(8, true),
    dataLength: view.getUint32(12, true),
    checksum: view.getUint32(16, true),
    magic: view.getUint32(20, true),
  };
}

/**
 * Generate an RSA key pair for ADB authentication
 * Falls back to sending public key directly if crypto not available
 */
async function generateAdbKeyPair() {
  try {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'RSASSA-PKCS1-v1_5',
        modulusLength: 2048,
        publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
        hash: 'SHA-1',
      },
      true,
      ['sign', 'verify']
    );
    return keyPair;
  } catch (e) {
    console.warn('WebCrypto RSA generation failed, using fallback:', e);
    return null;
  }
}

/**
 * Sign data with the ADB private key
 */
async function signToken(privateKey, token) {
  try {
    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      privateKey,
      token
    );
    return new Uint8Array(signature);
  } catch (e) {
    console.warn('Signing failed:', e);
    return null;
  }
}

/**
 * Export the public key in ADB format
 */
async function exportPublicKey(publicKey) {
  try {
    const exported = await crypto.subtle.exportKey('spki', publicKey);
    const b64 = btoa(String.fromCharCode(...new Uint8Array(exported)));
    // ADB expects the key followed by " hostname\0"
    const hostname = 'ITShare@WebADB';
    return encodeString(b64 + ' ' + hostname + '\0');
  } catch (e) {
    console.warn('Public key export failed:', e);
    return encodeString('ITShare@WebADB\0');
  }
}


// ─── MAIN ADB CLIENT CLASS ───

export class AdbClient {
  constructor() {
    this.device = null;
    this.interfaceNumber = -1;
    this.endpointIn = -1;
    this.endpointOut = -1;
    this.connected = false;
    this.localId = 1;
    this.keyPair = null;
    this.deviceInfo = null;
    this._listeners = {};
  }

  // Event emitter
  on(event, callback) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(callback);
  }

  _emit(event, data) {
    (this._listeners[event] || []).forEach(cb => cb(data));
  }

  /**
   * Check if WebUSB is supported
   */
  static isSupported() {
    return !!navigator.usb;
  }

  /**
   * Request and connect to an Android device via WebUSB
   */
  async connect() {
    if (!AdbClient.isSupported()) {
      throw new Error('WebUSB is not supported in this browser. Use Chrome, Edge, or Brave.');
    }

    try {
      // Show USB device picker filtered to ADB devices
      this.device = await navigator.usb.requestDevice({
        filters: [
          { classCode: ADB_CLASS, subclassCode: ADB_SUBCLASS, protocolCode: ADB_PROTOCOL },
          // Common Android vendor IDs as fallback
          { vendorId: 0x18d1 }, // Google
          { vendorId: 0x04e8 }, // Samsung
          { vendorId: 0x2717 }, // Xiaomi
          { vendorId: 0x12d1 }, // Huawei
          { vendorId: 0x2a70 }, // OnePlus
          { vendorId: 0x22b8 }, // Motorola
          { vendorId: 0x0bb4 }, // HTC
          { vendorId: 0x0fce }, // Sony
          { vendorId: 0x1004 }, // LG
          { vendorId: 0x2ae5 }, // Fairphone
          { vendorId: 0x0e8d }, // MediaTek
          { vendorId: 0x1949 }, // Lab126 (Amazon)
          { vendorId: 0x2b4c }, // Realme
          { vendorId: 0x2a45 }, // Meizu
          { vendorId: 0x1bbb }, // T-Mobile
          { vendorId: 0x0502 }, // Acer
          { vendorId: 0x0b05 }, // ASUS
          { vendorId: 0x413c }, // Dell
          { vendorId: 0x0489 }, // Foxconn
          { vendorId: 0x091e }, // Garmin
          { vendorId: 0x2080 }, // Nook
          { vendorId: 0x19d2 }, // ZTE
          { vendorId: 0x2116 }, // KT Tech
        ],
      });

      this._emit('log', `Device selected: ${this.device.productName || 'Unknown'}`);
      await this.device.open();

      // Find ADB interface
      let found = false;
      for (const config of this.device.configurations) {
        for (const iface of config.interfaces) {
          for (const alt of iface.alternates) {
            if (alt.interfaceClass === ADB_CLASS &&
                alt.interfaceSubclass === ADB_SUBCLASS &&
                alt.interfaceProtocol === ADB_PROTOCOL) {
              this.interfaceNumber = iface.interfaceNumber;
              // Find endpoints
              for (const ep of alt.endpoints) {
                if (ep.direction === 'in') this.endpointIn = ep.endpointNumber;
                if (ep.direction === 'out') this.endpointOut = ep.endpointNumber;
              }
              found = true;
              break;
            }
          }
          if (found) break;
        }
        if (found) break;
      }

      if (!found) {
        // Try first configuration's first interface as fallback
        const config = this.device.configurations[0];
        if (config && config.interfaces.length > 0) {
          const iface = config.interfaces[config.interfaces.length - 1];
          this.interfaceNumber = iface.interfaceNumber;
          const alt = iface.alternates[0];
          for (const ep of alt.endpoints) {
            if (ep.direction === 'in') this.endpointIn = ep.endpointNumber;
            if (ep.direction === 'out') this.endpointOut = ep.endpointNumber;
          }
          found = true;
        }
      }

      if (!found || this.endpointIn === -1 || this.endpointOut === -1) {
        throw new Error('Could not find ADB interface on device. Make sure USB Debugging is enabled.');
      }

      await this.device.selectConfiguration(1);
      await this.device.claimInterface(this.interfaceNumber);

      this._emit('log', 'USB interface claimed. Starting ADB handshake...');

      // Perform ADB connection handshake
      await this._performHandshake();

      this.connected = true;
      this._emit('connected', this.deviceInfo);
      return this.deviceInfo;

    } catch (error) {
      this.connected = false;
      if (error.name === 'NotFoundError') {
        throw new Error('No device selected. Please select your Android device from the USB dialog.');
      }
      throw error;
    }
  }

  /**
   * Perform ADB protocol handshake (CNXN → AUTH → CNXN)
   */
  async _performHandshake() {
    // Generate RSA key for authentication
    this.keyPair = await generateAdbKeyPair();

    // Send CNXN message
    const systemIdentity = encodeString('host::ITShare-WebADB\0');
    const cnxnMsg = buildMessage(A_CNXN, ADB_VERSION, MAX_PAYLOAD, systemIdentity);
    await this._sendMessage(cnxnMsg);

    // Read response — expect AUTH or CNXN
    const response = await this._readMessage();

    if (response.command === A_AUTH) {
      this._emit('log', 'Device requires authentication...');

      // Try to sign the token first
      if (this.keyPair && response.data) {
        const signature = await signToken(this.keyPair.privateKey, response.data);
        if (signature) {
          const authSignMsg = buildMessage(A_AUTH, AUTH_SIGNATURE, 0, signature);
          await this._sendMessage(authSignMsg);

          const authResp = await this._readMessage();
          if (authResp.command === A_CNXN) {
            this._parseDeviceInfo(authResp.data);
            this._emit('log', 'Connected with signed key!');
            return;
          }
        }
      }

      // Send public key — device will show "Allow USB debugging?" dialog
      const pubKeyData = this.keyPair
        ? await exportPublicKey(this.keyPair.publicKey)
        : encodeString('ITShare@WebADB\0');

      const authPubMsg = buildMessage(A_AUTH, AUTH_RSAPUBLICKEY, 0, pubKeyData);
      await this._sendMessage(authPubMsg);

      this._emit('log', '⚡ Check your phone — tap "Allow USB debugging" on the popup!');

      // Wait for the user to accept on device (with timeout)
      const cnxnResp = await this._readMessage(30000); // 30s timeout
      if (cnxnResp.command === A_CNXN) {
        this._parseDeviceInfo(cnxnResp.data);
        this._emit('log', 'Authentication successful!');
      } else {
        throw new Error('Authentication failed. Make sure you tapped "Allow" on the device.');
      }

    } else if (response.command === A_CNXN) {
      // Already trusted
      this._parseDeviceInfo(response.data);
      this._emit('log', 'Connected (already trusted)!');
    } else {
      throw new Error('Unexpected response from device during handshake.');
    }
  }

  /**
   * Parse device info from CNXN response
   */
  _parseDeviceInfo(data) {
    const infoStr = decodeString(data);
    this.deviceInfo = {
      raw: infoStr,
      product: '',
      model: '',
      device: '',
    };

    // Parse "device::ro.product.name=xxx;ro.product.model=xxx;..."
    const parts = infoStr.split(';');
    for (const part of parts) {
      const [key, val] = part.split('=');
      if (key && val) {
        if (key.includes('model')) this.deviceInfo.model = val;
        else if (key.includes('product') || key.includes('name')) this.deviceInfo.product = val;
        else if (key.includes('device')) this.deviceInfo.device = val;
      }
    }
  }

  /**
   * Send an ADB message over USB
   */
  async _sendMessage(msg) {
    await this.device.transferOut(this.endpointOut, msg.header);
    if (msg.data.length > 0) {
      await this.device.transferOut(this.endpointOut, msg.data);
    }
  }

  /**
   * Read an ADB message from USB
   */
  async _readMessage(timeout = 10000) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        // Read header (24 bytes)
        const headerResult = await this.device.transferIn(this.endpointIn, 24);
        if (headerResult.status !== 'ok') {
          throw new Error(`USB transfer failed: ${headerResult.status}`);
        }

        const header = parseMessage(new Uint8Array(headerResult.data.buffer));

        // Read data payload if present
        let data = new Uint8Array(0);
        if (header.dataLength > 0) {
          const dataResult = await this.device.transferIn(this.endpointIn, header.dataLength);
          if (dataResult.status === 'ok') {
            data = new Uint8Array(dataResult.data.buffer);
          }
        }

        return { ...header, data };
      } catch (e) {
        if (Date.now() - startTime >= timeout) throw e;
        await new Promise(r => setTimeout(r, 100));
      }
    }

    throw new Error('Timeout waiting for device response');
  }

  /**
   * Execute a shell command on the device
   * @param {string} command - shell command to run
   * @returns {Promise<string>} - command output
   */
  async shell(command) {
    if (!this.connected) throw new Error('Not connected to any device');

    const localId = this.localId++;
    const destination = encodeString(`shell:${command}\0`);

    // OPEN stream
    const openMsg = buildMessage(A_OPEN, localId, 0, destination);
    await this._sendMessage(openMsg);

    // Wait for OKAY
    let response = await this._readMessage();
    if (response.command !== A_OKAY) {
      throw new Error(`Failed to open shell: command=${response.command}`);
    }

    const remoteId = response.arg0;
    let output = '';

    // Read all WRTE messages until CLSE
    while (true) {
      try {
        response = await this._readMessage(15000);

        if (response.command === A_WRTE) {
          output += decodeString(response.data);
          // Send OKAY to acknowledge
          const okMsg = buildMessage(A_OKAY, localId, remoteId);
          await this._sendMessage(okMsg);
        } else if (response.command === A_CLSE) {
          // Stream closed — send CLSE back
          const clseMsg = buildMessage(A_CLSE, localId, remoteId);
          await this._sendMessage(clseMsg);
          break;
        } else if (response.command === A_OKAY) {
          // Just an ack, continue
          continue;
        }
      } catch (e) {
        // Timeout or error — assume command finished
        break;
      }
    }

    return output.trim();
  }

  /**
   * List all installed packages
   */
  async listPackages() {
    const output = await this.shell('pm list packages -f');
    return output.split('\n')
      .filter(line => line.startsWith('package:'))
      .map(line => {
        // Format: package:/data/app/com.example-1/base.apk=com.example
        const eqIdx = line.lastIndexOf('=');
        const packageName = line.substring(eqIdx + 1).trim();
        const apkPath = line.substring(8, eqIdx);
        return { packageName, apkPath };
      });
  }

  /**
   * List third-party (user-installed) packages only
   */
  async listThirdPartyPackages() {
    const output = await this.shell('pm list packages -3');
    return output.split('\n')
      .filter(line => line.startsWith('package:'))
      .map(line => line.replace('package:', '').trim());
  }

  /**
   * Get detailed device information
   */
  async getDeviceInfo() {
    const [model, brand, android, sdk, serial, display, battery] = await Promise.all([
      this.shell('getprop ro.product.model'),
      this.shell('getprop ro.product.brand'),
      this.shell('getprop ro.build.version.release'),
      this.shell('getprop ro.build.version.sdk'),
      this.shell('getprop ro.serialno'),
      this.shell('wm size'),
      this.shell('dumpsys battery'),
    ]);

    // Parse battery info
    let batteryLevel = '?';
    let batteryStatus = '?';
    const levelMatch = battery.match(/level:\s*(\d+)/);
    const statusMatch = battery.match(/status:\s*(\d+)/);
    if (levelMatch) batteryLevel = levelMatch[1] + '%';
    if (statusMatch) {
      const statuses = { 1: 'Unknown', 2: 'Charging', 3: 'Discharging', 4: 'Not Charging', 5: 'Full' };
      batteryStatus = statuses[statusMatch[1]] || 'Unknown';
    }

    // Parse screen resolution
    const sizeMatch = display.match(/(\d+x\d+)/);
    const resolution = sizeMatch ? sizeMatch[1] : 'Unknown';

    return {
      model: model || 'Unknown',
      brand: (brand || 'Unknown').charAt(0).toUpperCase() + (brand || '').slice(1),
      androidVersion: android || 'Unknown',
      sdkVersion: sdk || 'Unknown',
      serial: serial || 'Unknown',
      resolution,
      batteryLevel,
      batteryStatus,
    };
  }

  /**
   * Uninstall a package (for current user, keeps data)
   * This doesn't require root — removes for user 0
   */
  async uninstallPackage(packageName) {
    this._emit('log', `Removing ${packageName}...`);
    const result = await this.shell(`pm uninstall -k --user 0 ${packageName}`);
    const success = result.toLowerCase().includes('success');
    this._emit('log', success ? `✅ ${packageName} removed` : `❌ Failed: ${result}`);
    return { success, output: result };
  }

  /**
   * Force stop a running app
   */
  async forceStop(packageName) {
    await this.shell(`am force-stop ${packageName}`);
    this._emit('log', `Force stopped ${packageName}`);
  }

  /**
   * Disable a package
   */
  async disablePackage(packageName) {
    const result = await this.shell(`pm disable-user --user 0 ${packageName}`);
    return result;
  }

  /**
   * Set Private DNS (no root required, Android 9+)
   */
  async setPrivateDns(hostname) {
    await this.shell('settings put global private_dns_mode hostname_strict');
    const result = await this.shell(`settings put global private_dns_specifier ${hostname}`);
    this._emit('log', `Private DNS set to ${hostname}`);
    return result;
  }

  /**
   * Disable Private DNS
   */
  async disablePrivateDns() {
    await this.shell('settings put global private_dns_mode off');
    this._emit('log', 'Private DNS disabled');
  }

  /**
   * Get current Private DNS setting
   */
  async getPrivateDns() {
    const mode = await this.shell('settings get global private_dns_mode');
    const specifier = await this.shell('settings get global private_dns_specifier');
    return { mode: mode.trim(), specifier: specifier.trim() };
  }

  /**
   * Push hosts file (requires root/adb root)
   */
  async pushHostsFile(hostsContent) {
    // Write to temp location first
    const escaped = hostsContent.replace(/'/g, "'\\''");
    try {
      await this.shell(`echo '${escaped}' > /data/local/tmp/hosts`);
      // Try to mount system rw and copy (needs root)
      await this.shell('mount -o rw,remount /system');
      const result = await this.shell('cp /data/local/tmp/hosts /system/etc/hosts');
      await this.shell('mount -o ro,remount /system');
      this._emit('log', 'Hosts file pushed successfully');
      return { success: true, output: result };
    } catch (e) {
      this._emit('log', '❌ Hosts file push failed — root access required');
      return { success: false, output: 'Root access required to modify /system/etc/hosts' };
    }
  }

  /**
   * Get running services for a package
   */
  async getRunningServices(packageName) {
    const output = await this.shell(`dumpsys activity services ${packageName}`);
    return output;
  }

  /**
   * Get storage info
   */
  async getStorageInfo() {
    const output = await this.shell('df -h /data');
    return output;
  }

  /**
   * Disconnect from device
   */
  async disconnect() {
    try {
      if (this.device) {
        await this.device.releaseInterface(this.interfaceNumber);
        await this.device.close();
      }
    } catch (e) {
      // Ignore disconnect errors
    }
    this.connected = false;
    this.device = null;
    this._emit('disconnected');
    this._emit('log', 'Disconnected from device');
  }
}

// ─── SINGLETON INSTANCE ───
let _instance = null;

export function getAdbClient() {
  if (!_instance) _instance = new AdbClient();
  return _instance;
}

export default AdbClient;
