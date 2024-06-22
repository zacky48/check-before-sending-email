#
# Usage: Execute "sh build.sh" to create an add-on file in the "build" directory.
#
VERSION=$(grep '"version"' manifest.json | tr -d ',' | cut -d ':' -f 2 | tr -d '"' | tr -d '[:space:]')
zip -r "build/check-before-sending-email-${VERSION}.xpi" _locales images manifest.json src
