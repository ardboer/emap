#!/usr/bin/env bash
# macOS Developer Cleanup Script (robust against empty arrays)
# - Gradle caches & daemons
# - Xcode DerivedData & caches
# - Android Studio caches (safe by default; --android-deep for plugins)

# Use -e and -o pipefail; avoid -u to prevent array ‘unbound’ edge-cases on macOS Bash 3.x
set -eo pipefail

DRY_RUN=false
KEEP_DISTS=false
ANDROID_DEEP=false
declare -a PROJECT_PATHS=()   # explicit declare avoids unbound issues

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=true; shift ;;
    --keep-dists) KEEP_DISTS=true; shift ;;
    --android-deep) ANDROID_DEEP=true; shift ;;
    --project) PROJECT_PATHS+=("$2"); shift 2 ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

# ---------- helpers ----------
say() { echo -e "$@"; }
exists() { [[ -e "$1" ]]; }
remove() {
  local p="$1"
  if exists "$p"; then
    if $DRY_RUN; then say "[DRY RUN] Would remove: $p"; else
      say "Removing: $p"
      rm -rf "$p"
    fi
  fi
}
size_or_zero() { du -sh "$1" 2>/dev/null || echo "0B"; }

# ---------- Gradle ----------
GRADLE_DIR="$HOME/.gradle"
declare -a GRADLE_TARGETS=(
  "$GRADLE_DIR/caches"
  "$GRADLE_DIR/daemon"
  "$GRADLE_DIR/native"
  "$GRADLE_DIR/notifications"
)
if ! $KEEP_DISTS; then
  GRADLE_TARGETS+=("$GRADLE_DIR/wrapper/dists")
fi
# Guard: only iterate if there are project paths
if ((${#PROJECT_PATHS[@]})); then
  for p in "${PROJECT_PATHS[@]}"; do
    GRADLE_TARGETS+=("$p/.gradle")
  done
fi

# ---------- Xcode ----------
XCODE_DERIVEDDATA="$HOME/Library/Developer/Xcode/DerivedData"
XCODE_DEVICE_SUPPORT="$HOME/Library/Developer/Xcode/iOS DeviceSupport"
XCODE_CACHES="$HOME/Library/Caches/com.apple.dt.Xcode"
declare -a XCODE_TARGETS=(
  "$XCODE_DERIVEDDATA"
  "$XCODE_DEVICE_SUPPORT"
  "$XCODE_CACHES"
)

# ---------- Android Studio (IntelliJ) ----------
# Globs may have zero matches; we’ll expand safely below.
declare -a AS_CACHES=(
  "$HOME/Library/Caches/Google/AndroidStudio*"
  "$HOME/Library/Caches/AndroidStudio*"
  "$HOME/Library/Logs/Google/AndroidStudio*"
  "$HOME/Library/Logs/AndroidStudio*"
)
declare -a AS_SYSTEM=(
  "$HOME/Library/Application Support/Google/AndroidStudio*/system"
  "$HOME/Library/Application Support/AndroidStudio*/system"
)
declare -a AS_PLUGINS=(
  "$HOME/Library/Application Support/Google/AndroidStudio*/plugins"
  "$HOME/Library/Application Support/AndroidStudio*/plugins"
)
declare -a ANDROID_LEGACY=(
  "$HOME/.android/build-cache"
  "$HOME/.android/cache"
)

# ---------- report (before) ----------
say "--------------------------------------------"
say "Before cleanup:"
say "Gradle:                $(size_or_zero "$GRADLE_DIR")"
say "Xcode DerivedData:     $(size_or_zero "$XCODE_DERIVEDDATA")"
AS_ESTIMATE="0B"
if compgen -G "$HOME/Library/Application Support/Google/AndroidStudio*/system" >/dev/null; then
  AS_ESTIMATE="$(du -sh $HOME/Library/Application\ Support/Google/AndroidStudio*/system 2>/dev/null | awk 'NR==1{print $1}')"
elif compgen -G "$HOME/Library/Application Support/AndroidStudio*/system" >/dev/null; then
  AS_ESTIMATE="$(du -sh $HOME/Library/Application\ Support/AndroidStudio*/system 2>/dev/null | awk 'NR==1{print $1}')"
fi
say "Android Studio system: ${AS_ESTIMATE}"
say "--------------------------------------------"

# ---------- perform cleanup ----------
for t in "${GRADLE_TARGETS[@]}"; do remove "$t"; done
for t in "${XCODE_TARGETS[@]}"; do remove "$t"; done

# Expand globs safely: iterate only over matches to avoid literal deletions
expand_and_remove() {
  local pattern
  for pattern in "$@"; do
    # shellcheck disable=SC2206
    local matches=( $pattern )
    if ((${#matches[@]})); then
      for m in "${matches[@]}"; do remove "$m"; done
    fi
  done
}
expand_and_remove "${AS_CACHES[@]}" "${AS_SYSTEM[@]}" "${ANDROID_LEGACY[@]}"
if $ANDROID_DEEP; then
  expand_and_remove "${AS_PLUGINS[@]}"
fi

# Kill Gradle daemons if any
pkill -f "GradleDaemon" 2>/dev/null || true

# ---------- report (after) ----------
say "--------------------------------------------"
say "After cleanup:"
if [[ -d "$GRADLE_DIR" ]]; then say "$(du -sh "$GRADLE_DIR")"; else say "~/.gradle removed"; fi
if [[ -d "$XCODE_DERIVEDDATA" ]]; then say "$(du -sh "$XCODE_DERIVEDDATA")"; else say "DerivedData removed"; fi
say "✅ Cleanup complete!"

