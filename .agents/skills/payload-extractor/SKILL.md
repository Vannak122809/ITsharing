---
name: payload-extractor
description: Automatically compiles C/ASM files into position-independent shellcode, extracts the raw bytes, and formats them for injection or memory scanning.
---

# Payload Extractor Skill

When the user asks to extract shellcode or generate an AOB from a file, follow these steps exactly:

1. **Compile**: 
   - For C/C++ files: `gcc -O2 -nostdlib -fPIC -shared -masm=intel -o payload.elf <file>`
   - For ASM files: `nasm -f elf64 -o payload.elf <file>`
2. **Extract**: Run `objcopy -O binary -j .text payload.elf payload.bin`.
3. **Analyze**: Read `payload.bin` (e.g., using Python or `xxd`). Scan for `\x00` (null-bytes). If found, warn the user explicitly.
4. **Output**: 
   - By default, format the binary data as a C-style hex array (`\x90\x90...`).
   - If the user requested an AOB pattern, format it as space-separated hex bytes (`90 90 ...`).
5. **Clean up**: Remove `payload.elf` and `payload.bin` after extraction to keep the workspace clean.
