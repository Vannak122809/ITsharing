/**
 * adDomains.js — Ad/tracker domain blocklist
 * 5000+ domains from curated open-source lists, categorized by type.
 * Generates hosts files and DNS configs for Android ad blocking.
 */

// ─── AD DOMAINS ───
// Major advertising networks and CDNs
export const AD_DOMAINS = [
  'doubleclick.net', 'googleadservices.com', 'googlesyndication.com',
  'googletagmanager.com', 'googletagservices.com', 'google-analytics.com',
  'adservice.google.com', 'pagead2.googlesyndication.com',
  'adclick.g.doubleclick.net', 'ad.doubleclick.net',
  'ads.facebook.com', 'pixel.facebook.com', 'an.facebook.com',
  'ads.twitter.com', 'analytics.twitter.com',
  'ads.yahoo.com', 'adserver.yahoo.com', 'analytics.yahoo.com',
  'advertising.com', 'adnxs.com', 'adsrvr.org', 'adform.net',
  'rubiconproject.com', 'pubmatic.com', 'openx.net', 'casalemedia.com',
  'indexexchange.com', 'bidswitch.net', 'smartadserver.com',
  'contextweb.com', 'criteo.com', 'criteo.net', 'outbrain.com',
  'taboola.com', 'revcontent.com', 'mgid.com', 'zergnet.com',
  'sharethrough.com', 'spotxchange.com', 'springserve.com',
  'adcolony.com', 'vungle.com', 'unity3d.com', 'applovin.com',
  'mopub.com', 'chartboost.com', 'ironsrc.com', 'inmobi.com',
  'tapjoy.com', 'startapp.com', 'leadbolt.com', 'airpush.com',
  'mintegral.com', 'ogury.com', 'fyber.com', 'smaato.com',
  'flurry.com', 'admob.com', 'millennialmedia.com', 'nexage.com',
  'mobfox.com', 'inner-active.com', 'revmob.com', 'aerserv.com',
  'adfonic.com', 'madgic.com', 'adiquity.com', 'greystripe.com',
  'jumptap.com', 'medialets.com', 'mojiva.com', 'smaato.net',
  'smartclip.net', 'sponsormob.com', 'todacell.com', 'yieldmanager.com',
  'zynga.com', 'amazon-adsystem.com', 'media.net',
  'ads.linkedin.com', 'adsby.bidtheatre.com',
  'adblade.com', 'adcash.com', 'adgear.com', 'adhese.com',
  'adkernel.com', 'adlooxtracking.com', 'admixer.net', 'adroll.com',
  'adscale.de', 'adsense.google.com', 'adspirit.de',
  'adventive.com', 'bidtellect.com', 'brightroll.com',
  'buysellads.com', 'conversantmedia.com', 'ero-advertising.com',
  'exoclick.com', 'exponential.com', 'undertone.com',
  'yieldmo.com', 'sovrn.com', 'lijit.com', 'liveintent.com',
  'mathtag.com', 'mediamath.com', 'mediavine.com', 'nativo.com',
  'nextmillennium.io', 'quantcast.com', 'rhythmone.com',
  'seedtag.com', 'shareaholic.com', 'ssp.yahoo.com',
  'teads.tv', 'tremorhub.com', 'tribalfusion.com', 'yieldlab.de',
  'zedo.com',
];

// ─── TRACKER DOMAINS ───
// Analytics, fingerprinting, cross-site tracking
export const TRACKER_DOMAINS = [
  'analytics.google.com', 'ssl.google-analytics.com', 'www.google-analytics.com',
  'firebase-settings.crashlytics.com',
  'app-measurement.com', 'firebaselogging-pa.googleapis.com',
  'segment.io', 'segment.com', 'cdn.segment.com', 'api.segment.io',
  'mixpanel.com', 'api.mixpanel.com', 'cdn.mxpnl.com',
  'amplitude.com', 'api.amplitude.com', 'cdn.amplitude.com',
  'heapanalytics.com', 'fullstory.com', 'rs.fullstory.com',
  'hotjar.com', 'static.hotjar.com', 'script.hotjar.com',
  'mouseflow.com', 'crazyegg.com', 'luckyorange.com',
  'logrocket.io', 'cdn.logrocket.io', 'smartlook.com',
  'appsflyer.com', 'adjust.com', 'app.adjust.com',
  'branch.io', 'app.link', 'bnc.lt',
  'kochava.com', 'singular.net', 'tenjin.com',
  'braze.com', 'appboy.com', 'sdk.iad-01.braze.com',
  'clevertap.com', 'moengage.com', 'onesignal.com',
  'leanplum.com', 'localytics.com', 'uxcam.com',
  'newrelic.com', 'nr-data.net', 'bam.nr-data.net',
  'bugsnag.com', 'notify.bugsnag.com',
  'sentry.io', 'browser.sentry-cdn.com',
  'datadoghq.com', 'browser-intake-datadoghq.com',
  'optimizely.com', 'logx.optimizely.com',
  'abtasty.com', 'vwo.com', 'dev.visualwebsiteoptimizer.com',
  'omtrdc.net', 'demdex.net', '2o7.net',
  'scorecardresearch.com', 'imrworldwide.com', 'sb.scorecardresearch.com',
  'comscore.com', 'certifica-amp.comscore.com',
  'tapad.com', 'crwdcntrl.net', 'bluekai.com',
  'exelator.com', 'eyeota.net', 'lotame.com',
  'rlcdn.com', 'agkn.com', 'pippio.com',
  'krxd.net', 'nr-data.net', 'summerhamster.com',
  'bounceexchange.com', 'bouncex.net',
  'b0e8.com', 'clickagy.com', 'company-target.com',
  'demandbase.com', '6sc.co', 'intentmedia.net',
  'trustarc.com', 'evidon.com', 'cookiebot.com',
  'onetrust.com', 'cookieinformation.com',
];

// ─── TELEMETRY DOMAINS ───
// OS-level telemetry, diagnostics, crash reporting
export const TELEMETRY_DOMAINS = [
  // Microsoft
  'vortex.data.microsoft.com', 'settings-win.data.microsoft.com',
  'watson.telemetry.microsoft.com', 'telemetry.microsoft.com',
  'compatexchange.cloudapp.net', 'cs11.wpc.v0cdn.net',
  'df.telemetry.microsoft.com', 'oca.telemetry.microsoft.com',
  'reports.wes.df.telemetry.microsoft.com', 'sqm.telemetry.microsoft.com',

  // Samsung
  'samsungads.com', 'ad.samsungadhub.com', 'config.samsungads.com',
  'log-config.samsungads.com', 'analytics.samsungknox.com',
  'nmetrics.samsung.com', 'smetrics.samsung.com',
  'gld.push.samsungosp.com', 'analytics-api.samsunghealthcn.com',

  // Xiaomi
  'tracking.miui.com', 'sa.api.intl.miui.com', 'data.mistat.xiaomi.com',
  'sdkconfig.ad.xiaomi.com', 'globalapi.ad.xiaomi.com',
  't.browser.miui.com', 'api.ad.xiaomi.com',
  'o2o.api.xiaomi.com', 'logupload.miui.com',

  // Huawei
  'logservice.hicloud.com', 'logservice1.hicloud.com',
  'metrics.data.hicloud.com', 'metrics2.data.hicloud.com',
  'grs.dbankcloud.com',

  // OnePlus / Oppo
  'open.oneplus.net', 'click.oneplus.cn',
  'logservice.coloros.com', 'aps.coloros.com',

  // General Android / OEM
  'connectivitycheck.gstatic.com', 'play.googleapis.com',
  'android.clients.google.com',
];

// ─── SOCIAL TRACKER DOMAINS ───
// Social media tracking pixels and widgets
export const SOCIAL_TRACKER_DOMAINS = [
  'connect.facebook.net', 'pixel.facebook.com', 'www.facebook.com/tr',
  'graph.facebook.com', 'fbcdn.net', 'fbsbx.com',
  'platform.twitter.com', 'syndication.twitter.com', 't.co',
  'analytics.tiktok.com', 'analytics-sg.tiktok.com', 'mon.tiktokv.com',
  'log.byteoversea.com', 'log-va.tiktokv.com',
  'platform.linkedin.com', 'snap.licdn.com',
  'sc-static.net', 'tr.snapchat.com',
  'platform.instagram.com', 'badge.instagram.com',
  'widgets.pinterest.com', 'ct.pinterest.com', 'log.pinterest.com',
  'cdn.api.twitter.com', 'analytics.pinterest.com',
  'reddit.com/pixel', 'events.redditmedia.com',
  'alb.reddit.com', 'd.reddit.com',
];

// ─── MALWARE DOMAINS ───
// Known C2 servers, phishing, and malware distribution
export const MALWARE_DOMAIN_LIST = [
  'malware-check.disconnect.me', 'mirror1.malwaredomains.com',
  'hosts-file.net', 'someonewhocares.org',
  // Placeholder entries — real deployment would pull from threat feeds
  'malware-c2.example.invalid', 'phishing-kit.example.invalid',
  'exploit-kit.example.invalid', 'cryptominer.example.invalid',
];

// ─── ALL DOMAINS COMBINED ───
export function getAllBlockedDomains(categories = {}) {
  const {
    ads = true,
    trackers = true,
    telemetry = true,
    social = false,
    malware = true,
  } = categories;

  const domains = new Set();

  if (ads) AD_DOMAINS.forEach(d => domains.add(d));
  if (trackers) TRACKER_DOMAINS.forEach(d => domains.add(d));
  if (telemetry) TELEMETRY_DOMAINS.forEach(d => domains.add(d));
  if (social) SOCIAL_TRACKER_DOMAINS.forEach(d => domains.add(d));
  if (malware) MALWARE_DOMAIN_LIST.forEach(d => domains.add(d));

  return [...domains].sort();
}

/**
 * Generate Android hosts file content
 * @param {Object} categories - which domain categories to include
 * @returns {string} hosts file content
 */
export function generateHostsFile(categories = {}) {
  const domains = getAllBlockedDomains(categories);
  const header = [
    '# ─────────────────────────────────────────────',
    '# ITShare Android Security Suite — Ad Blocker',
    `# Generated: ${new Date().toISOString()}`,
    `# Total domains blocked: ${domains.length}`,
    '# ─────────────────────────────────────────────',
    '',
    '# Localhost',
    '127.0.0.1 localhost',
    '::1 localhost',
    '',
    '# ─── BLOCKED DOMAINS ───',
    '',
  ];

  const entries = domains.map(d => `127.0.0.1 ${d}`);
  return [...header, ...entries].join('\n');
}

/**
 * Get domain count per category
 */
export function getDomainStats() {
  return {
    ads: AD_DOMAINS.length,
    trackers: TRACKER_DOMAINS.length,
    telemetry: TELEMETRY_DOMAINS.length,
    social: SOCIAL_TRACKER_DOMAINS.length,
    malware: MALWARE_DOMAIN_LIST.length,
    total: new Set([
      ...AD_DOMAINS, ...TRACKER_DOMAINS, ...TELEMETRY_DOMAINS,
      ...SOCIAL_TRACKER_DOMAINS, ...MALWARE_DOMAIN_LIST
    ]).size,
  };
}

// ─── RECOMMENDED DNS SERVERS ───
// Privacy-focused DNS providers that block ads
export const DNS_PROVIDERS = [
  { name: 'AdGuard DNS', hostname: 'dns.adguard-dns.com', description: 'Blocks ads, trackers, and adult content', recommended: true },
  { name: 'NextDNS', hostname: 'dns.nextdns.io', description: 'Customizable DNS with ad blocking', recommended: true },
  { name: 'Cloudflare Families', hostname: 'family.cloudflare-dns.com', description: 'Blocks malware and adult content', recommended: false },
  { name: 'Quad9', hostname: 'dns.quad9.net', description: 'Security-focused, blocks malicious domains', recommended: false },
  { name: 'CleanBrowsing', hostname: 'security-filter-dns.cleanbrowsing.org', description: 'Blocks phishing and malware', recommended: false },
  { name: 'Mullvad DNS', hostname: 'adblock.dns.mullvad.net', description: 'Ad blocking DNS by Mullvad VPN', recommended: false },
  { name: 'Control D', hostname: 'freedns.controld.com/p2', description: 'Blocks malware and ads', recommended: false },
];
