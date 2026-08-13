#!/usr/bin/env bash
set -e

# Root directory
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}   OmniLearn LMS Mobile App Automation & Launcher   ${NC}"
echo -e "${BLUE}======================================================${NC}"

# Setup Environment Variables
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"

# -------------------------------------------------------------
# STEP 1: Process Cleanup
# -------------------------------------------------------------
echo -e "\n${YELLOW}[1/5] Cleaning up existing processes & resetting ADB...${NC}"

PID_5000=$(lsof -ti:5000 2>/dev/null || true)
if [ -n "$PID_5000" ]; then
  echo "Stopping process running on port 5000 (PID $PID_5000)..."
  kill -9 $PID_5000 2>/dev/null || true
fi

echo "Stopping any existing Android emulator processes..."
pkill -9 -f "emulator.*Medium_Phone" 2>/dev/null || true
pkill -9 -f "qemu-system" 2>/dev/null || true

echo "Resetting ADB server..."
adb kill-server >/dev/null 2>&1 || true
lsof -ti:5037 | xargs kill -9 2>/dev/null || true
adb start-server >/dev/null 2>&1
echo -e "${GREEN}✓ Cleanup finished and ADB reset.${NC}"

# -------------------------------------------------------------
# STEP 2: Start Backend Server & Verify Health
# -------------------------------------------------------------
echo -e "\n${YELLOW}[2/5] Starting Backend Server...${NC}"
cd "$ROOT_DIR/server"
nohup npm run dev > "$ROOT_DIR/server/backend.log" 2>&1 &
SERVER_PID=$!
disown $SERVER_PID 2>/dev/null || true
echo "Backend process launched in background (PID $SERVER_PID)."

echo "Polling http://localhost:5000 until backend is responsive..."
MAX_ATTEMPTS=30
ATTEMPT=0
SERVER_READY=false

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  if curl -s -f http://localhost:5000/api/health >/dev/null 2>&1 || curl -s http://localhost:5000/ >/dev/null 2>&1; then
    SERVER_READY=true
    break
  fi
  sleep 1
  ATTEMPT=$((ATTEMPT + 1))
done

if [ "$SERVER_READY" = false ]; then
  echo -e "${RED}❌ Backend server failed to respond on http://localhost:5000 within 30 seconds.${NC}"
  echo "Backend logs:"
  cat "$ROOT_DIR/server/backend.log"
  exit 1
fi
echo -e "${GREEN}✓ Backend server is active and listening on http://localhost:5000!${NC}"

# -------------------------------------------------------------
# STEP 3: Start Android Emulator & Poll Boot Completion
# -------------------------------------------------------------
AVD_NAME="Medium_Phone"
echo -e "\n${YELLOW}[3/5] Launching Android Emulator ($AVD_NAME)...${NC}"

emulator -avd "$AVD_NAME" -gpu swiftshader_indirect -no-snapshot-load > "$ROOT_DIR/emulator.log" 2>&1 &
EMULATOR_PID=$!
disown $EMULATOR_PID 2>/dev/null || true
echo "Emulator launched (PID $EMULATOR_PID)."

echo "Polling ADB devices until '$AVD_NAME' is fully booted..."
MAX_EMU_ATTEMPTS=120
EMU_ATTEMPT=0
EMU_READY=false
EMU_SERIAL=""

while [ $EMU_ATTEMPT -lt $MAX_EMU_ATTEMPTS ]; do
  EMU_SERIAL=$(adb devices | grep -E "emulator-[0-9]+" | grep "device" | awk '{print $1}' | head -n 1 || true)
  
  if [ -n "$EMU_SERIAL" ]; then
    BOOT_COMPLETED=$(adb -s "$EMU_SERIAL" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r' || true)
    if [ "$BOOT_COMPLETED" = "1" ]; then
      EMU_READY=true
      break
    fi
  fi
  sleep 2
  EMU_ATTEMPT=$((EMU_ATTEMPT + 1))
done

if [ "$EMU_READY" = false ]; then
  echo -e "${RED}❌ Android emulator failed to reach 'device' ready state within 240 seconds.${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Emulator is fully booted and online ($EMU_SERIAL)!${NC}"

echo "Setting up ADB port forwarding (tcp:5000 -> tcp:5000)..."
adb -s "$EMU_SERIAL" reverse tcp:5000 tcp:5000 || true

# -------------------------------------------------------------
# STEP 4: Build Mobile Assets & Run Capacitor
# -------------------------------------------------------------
echo -e "\n${YELLOW}[4/5] Building Mobile Frontend & Deploying with Capacitor...${NC}"
cd "$ROOT_DIR/client"

npm run build:mobile
npx cap sync android
echo "Uninstalling existing app to clear emulator cache..."
adb -s "$EMU_SERIAL" uninstall com.omnilearn.lms || true
cd android && ./gradlew installDebug
adb -s "$EMU_SERIAL" shell am start -n com.omnilearn.lms/.MainActivity

echo -e "${GREEN}✓ Capacitor Android build and installation succeeded!${NC}"

# -------------------------------------------------------------
# STEP 5: Post-Launch App Verification
# -------------------------------------------------------------
echo -e "\n${YELLOW}[5/5] Verifying App Execution on Device...${NC}"
sleep 3

FOCUSED_APP=$(adb -s "$EMU_SERIAL" shell dumpsys window | grep -E "mCurrentFocus|mFocusedApp" || true)
echo "Current Focused Window on Emulator:"
echo "$FOCUSED_APP"

if echo "$FOCUSED_APP" | grep -qi "omnilearn\|falconswift"; then
  echo -e "\n${GREEN}======================================================${NC}"
  echo -e "${GREEN}🎉 SUCCESS: OmniLearn LMS Mobile App launched cleanly!${NC}"
  echo -e "${GREEN}======================================================${NC}"
else
  echo -e "${YELLOW}Notice: App deployed. Focused window: $FOCUSED_APP${NC}"
fi
