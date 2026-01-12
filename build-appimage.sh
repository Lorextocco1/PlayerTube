#!/bin/bash

# Script di build automatizzato per PlayerTube AppImage
# Ottimizzato per Steam Deck / Bazzite / Fedora

# Esce immediatamente se un comando fallisce
set -e

echo "------------------------------------------------"
echo "  🚀 INIZIO BUILD PLAYERTUBE APPIMAGE"
echo "------------------------------------------------"

# 1. Verifica dipendenze
if [ ! -d "node_modules/electron" ]; then
    echo "📦 Electron non trovato o installazione corrotta. Reinstallazione..."
    npm install
else
    echo "✅ Dipendenze rilevate."
fi

# 2. Pulizia build precedenti
echo "🧹 Pulizia build precedenti..."
rm -rf dist dist_electron

# 3. Build Frontend (Vite)
echo "🛠️ Compilazione React con Vite..."
npm run build

# 4. Packaging Electron
echo "📦 Generazione pacchetto AppImage..."
# Chiamiamo direttamente lo script npm che ora punta a electron-builder con npx interno
npm run dist

echo "------------------------------------------------"
echo "  ✅ OPERAZIONE COMPLETATA!"
echo "  Controlla la cartella: ./dist_electron/"
echo "------------------------------------------------"

