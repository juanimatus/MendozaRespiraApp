const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const srcSvg = fs.readFileSync(path.join(root, 'public/icons/icon-source.svg'));
const bg = '#14261a';

async function main() {
  await sharp(srcSvg).resize(192, 192).png()
    .toFile(path.join(root, 'public/icons/icon-192.png'));

  await sharp(srcSvg).resize(512, 512).png()
    .toFile(path.join(root, 'public/icons/icon-512.png'));

  // Maskable: shrink artwork so it sits inside the ~80% safe zone OS masks keep,
  // then pad out to full canvas with the brand background.
  const inner = await sharp(srcSvg).resize(420, 420).png().toBuffer();
  await sharp({ create: { width: 512, height: 512, channels: 4, background: bg } })
    .composite([{ input: inner, left: 46, top: 46 }])
    .png()
    .toFile(path.join(root, 'public/icons/icon-maskable-512.png'));

  // iOS ignores alpha on the touch icon and shows black where it's transparent.
  await sharp(srcSvg).resize(180, 180).flatten({ background: bg }).png()
    .toFile(path.join(root, 'public/apple-touch-icon.png'));

  await sharp(srcSvg).resize(32, 32).png()
    .toFile(path.join(root, 'public/favicon-32x32.png'));
  await sharp(srcSvg).resize(16, 16).png()
    .toFile(path.join(root, 'public/favicon-16x16.png'));

  console.log('Icons generated.');
}

main().catch((e) => { console.error(e); process.exit(1); });
