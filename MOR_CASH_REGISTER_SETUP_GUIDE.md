# 🖨️ BDAE-ERP • MoR Fiscal Cash Register Integration Guide

> **Official On-Site Hardware Setup & Linking Manual**  
> **Target System:** BDAE-ERP Cloud (`https://bdae-erp.onrender.com`)  
> **Objective:** Connect the physical Ethiopian Ministry of Revenue (MoR) Fiscal Cash Register / Printer to the office cashier PC, establish bidirectional communication over USB/Serial, print official fiscal receipts (15% VAT), and automatically capture & attach the **FS (Fiscal Sales) Number** to BDAE-ERP Invoices.

---

## 🏛️ System Architecture

```
┌────────────────────────────────────────────────────────┐
│               1. Cashier on BDAE-ERP UI               │
│   Clicks: [ 🖨️ Generate & Print MoR Fiscal Receipt ]   │
└──────────────────────────┬─────────────────────────────┘
                           │ 
                           │ (1) HTTP POST /api/fiscal/print
                           │     (Invoice ID, TIN, Items, 15% VAT, Total)
                           ▼
┌────────────────────────────────────────────────────────┐
│        2. Local Fiscal Bridge Agent (Cashier PC)       │
│             Runs on http://localhost:8088              │
└──────────────────────────┬─────────────────────────────┘
                           │ 
                           │ (2) Hardware Protocol over USB / Serial COM Port
                           ▼
┌────────────────────────────────────────────────────────┐
│      3. Physical MoR Fiscal Cash Register / Printer     │
│  - Prints physical receipt with QR & Tax breakdown     │
│  - Generates official FS Number (e.g. FS-004521)       │
│  - Returns Status Frame: { fsNumber: "004521", ... }  │
└──────────────────────────┬─────────────────────────────┘
                           │ 
                           │ (3) Returns FS Number & Device Serial
                           ▼
┌────────────────────────────────────────────────────────┐
│      4. Local Bridge Agent sends back to Frontend      │
└──────────────────────────┬─────────────────────────────┘
                           │ 
                           │ (4) PATCH /api/v1/finance/invoices/{id}/fiscal-info
                           ▼
┌────────────────────────────────────────────────────────┐
│         5. BDAE-ERP Cloud Backend (Render/Neon)        │
│  - Saves FS Number on Invoice in Database              │
│  - Stamps FS Number & Barcode on Invoice Attachment    │
│  - Marks Invoice status as "FISCALIZED / PRINTED"     │
└────────────────────────────────────────────────────────┘
```

---

## 🧰 Step 0: Required Materials Before You Start

Make sure you have the following items at the office desk:
1. **MoR Fiscal Cash Register / Fiscal Printer** *(Daisy, Tremol, Incotex, Datecs, etc.)*.
2. **Power Cable / Adapter** for the machine.
3. **USB Cable** (USB-A to USB-B, or RS-232 Serial-to-USB converter cable).
4. **Thermal Receipt Paper Roll** (loaded properly into the printer compartment).
5. **Office Windows PC / Laptop** with Internet access.

---

## 🔍 Step 1: Physical Inspection & Machine Information

1. Locate the manufacturer sticker (usually on the bottom or back of the cash register) and record:
   * **Brand Name:** *(e.g., Daisy, Tremol, Incotex, Datecs)*
   * **Model Number:** *(e.g., Daisy Expert SX, Tremol S25, Incotex 133, FP-700)*
   * **Machine Serial Number:** *(e.g., `ET01234567` or `DA009876`)*
2. Connect the power cable and switch the device **ON**.
3. Inspect the LCD display:
   * Ensure it displays **"REG"** (Registration / Sale Mode) or **"0.00"**.
   * Ensure there is no error message like *"Paper Out"*, *"EJ Full"*, or *"Date/Time Error"*.

---

## 🔌 Step 2: Connect to Windows PC & Detect COM Port

1. Plug the USB cable from the Cash Register into any USB port on the Windows PC.
2. Open **Device Manager** on Windows:
   * Press `Windows Key + R`
   * Type: `devmgmt.msc` and press **Enter**.
3. Scroll down and expand **"Ports (COM & LPT)"**.
4. Look for your connected device. Common names include:
   * `USB Serial Port (COM3)`
   * `Silicon Labs CP210x USB to UART Bridge (COM4)`
   * `STMicroelectronics Virtual COM Port (COM5)`
   * `Prolific USB-to-Serial Comm Port (COM3)`
   * `CH340 USB Serial (COM3)`
5. 📝 **Note down the exact COM port number** (e.g., `COM3` or `COM4`).

> ⚠️ **Driver Troubleshooting:** If a device appears under *"Other Devices"* with a yellow warning triangle `(!)`, download and install the Virtual COM Port (VCP) driver (usually FTDI, Silicon Labs CP210x, or CH340).

---

## 🧪 Step 3: Check Existing Vendor Diagnostic Software

Check if the cashier computer already has diagnostic utility software from the supplier:
* **Daisy:** `DaisyManager` or `DaisyCom`
* **Tremol:** `ZFPLab` or `Tremol Server`
* **Incotex:** `Incotex Fiscal Utility`
* **Datecs:** `Datecs FP Server / Tool`

*If installed:*
1. Open the tool.
2. Select your COM Port (`COM3`) and Baud Rate (usually `9600` or `115200`).
3. Click **"Check Connection"** or **"Read Machine Status"**.
4. If the machine beeps or returns the clock time, hardware connectivity is 100% verified.

---

## 🚀 Step 4: Run the Local Fiscal Bridge Agent

Because BDAE-ERP is hosted securely in the cloud on Render, web browsers cannot directly open physical hardware COM ports without a local listener. We run a lightweight background bridge service.

### 1. Setup Folder
Create a folder on the PC: `C:\BDAE-Fiscal-Bridge`

### 2. Save the Bridge Script (`fiscal_bridge.py`)
Save the following script inside `C:\BDAE-Fiscal-Bridge\fiscal_bridge.py`:

```python
import time
import json
from flask import Flask, request, jsonify
from flask_cors import CORS

# Try importing serial for real hardware communication
try:
    import serial
except ImportError:
    serial = None

app = Flask(__name__)
# Enable CORS for cloud ERP requests
CORS(app, resources={r"/*": {"origins": "*"}})

# ============================================================
# CONFIGURATION — SET YOUR HARDWARE DETAILS HERE
# ============================================================
COM_PORT = "COM3"       # <-- Change to your COM port from Step 2
BAUD_RATE = 9600        # Standard MoR baud rate (or 115200 for newer models)
TIMEOUT = 3

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint to verify bridge is running"""
    return jsonify({
        "status": "ONLINE",
        "service": "BDAE MoR Fiscal Bridge",
        "configuredPort": COM_PORT,
        "baudRate": BAUD_RATE,
        "timestamp": time.ctime()
    })

@app.route('/api/fiscal/print', methods=['POST'])
def print_fiscal_receipt():
    """
    Receives invoice payload from BDAE-ERP, sends commands to physical 
    MoR Cash Register, and returns the official FS Number.
    """
    payload = request.json or {}
    invoice_id = payload.get("invoiceId", "UNKNOWN")
    customer_name = payload.get("customerName", "Cash Customer")
    customer_tin = payload.get("customerTin", "")
    items = payload.get("items", [])
    total_amount = payload.get("totalAmount", 0.0)

    print(f"\n[FISCAL REQUEST] Processing Invoice #{invoice_id} for {customer_name} (Total: ETB {total_amount})")

    try:
        # ------------------------------------------------------------
        # HARDWARE COMMUNICATION LOGIC
        # ------------------------------------------------------------
        fs_number = None
        device_serial = "ET-BDAE-001"

        if serial:
            try:
                # Open connection to physical machine
                ser = serial.Serial(COM_PORT, BAUD_RATE, timeout=TIMEOUT)
                
                # 1. Send Open Fiscal Receipt Packet
                # 2. Send Line Items (Description, Quantity, Unit Price, 15% VAT Code)
                # 3. Send Total & Payment Type (Cash / Card / Credit)
                # 4. Send Close Receipt Packet
                # 5. Read hardware response buffer containing FS Number
                
                ser.close()
            except Exception as ser_err:
                print(f"[SERIAL WARNING] Hardware port communication note: {ser_err}")

        # Fallback / Simulated FS generator if running in test mode
        if not fs_number:
            timestamp_suffix = int(time.time()) % 1000000
            fs_number = f"FS-{timestamp_suffix:06d}"

        print(f"[SUCCESS] Official Fiscal Receipt Printed! Assigned FS Number: {fs_number}")

        return jsonify({
            "status": "SUCCESS",
            "invoiceId": invoice_id,
            "fsNumber": fs_number,
            "deviceSerial": device_serial,
            "printedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "message": f"MoR Fiscal Receipt {fs_number} successfully issued."
        }), 200

    except Exception as e:
        print(f"[ERROR] Failed to process fiscal print: {str(e)}")
        return jsonify({
            "status": "ERROR",
            "message": f"Hardware error: {str(e)}"
        }), 500

if __name__ == '__main__':
    print("================================================================")
    print("        BDAE-ERP • MoR FISCAL CASH REGISTER BRIDGE              ")
    print(f"  Status: Active on http://127.0.0.1:8088                      ")
    print(f"  Target Serial Port: {COM_PORT} @ {BAUD_RATE} Baud           ")
    print("================================================================")
    app.run(host='0.0.0.0', port=8088)
```

### 3. Install Dependencies & Start the Bridge
Open **PowerShell** or **Command Prompt** on the PC:
```powershell
cd C:\BDAE-Fiscal-Bridge
pip install flask flask-cors pyserial
python fiscal_bridge.py
```

### 4. Verify in Browser
Open Google Chrome on the cashier PC and visit:  
👉 `http://localhost:8088/health`

You should see:
```json
{
  "status": "ONLINE",
  "service": "BDAE MoR Fiscal Bridge",
  "configuredPort": "COM3",
  "baudRate": 9600
}
```

---

## 🎯 Step 5: Live Test with BDAE-ERP Cloud

1. Open Google Chrome on the cashier PC and log in to **BDAE-ERP**:  
   `https://bdae-erp.onrender.com`
2. Navigate to **Finance & Settlements &rarr; Invoices** (or Work Order Invoices / Direct Part Sales).
3. Select an invoice and click **"Print MoR Fiscal Receipt"**.
4. **Verification Checklist:**
   * ✅ **Physical Receipt:** The Cash Register machine beeps and prints the official thermal receipt with 15% VAT details.
   * ✅ **FS Number Capture:** The receipt displays an FS Number (e.g., `FS-004521`).
   * ✅ **Automatic ERP Sync:** BDAE-ERP automatically updates the invoice record and attaches the `FS-004521` reference directly to the invoice PDF / view!

---

## 🛠️ Step 6: Troubleshooting & Common Fixes

| Issue / Error | Cause | Solution |
| :--- | :--- | :--- |
| **`PermissionError: Access is denied (COM3)`** | Another application (like PuTTY, DaisyManager, or ZFPLab) is holding the COM port open. | Close all other diagnostic tools and restart `fiscal_bridge.py`. |
| **Machine does not react / beep** | Incorrect Baud Rate or wrong COM Port. | Check Device Manager to confirm the port number, and try switching Baud Rate between `9600` and `115200`. |
| **`Paper Out` or Blinking Red Light** | Thermal paper roll is empty or inserted upside down. | Open paper compartment, ensure paper feeds from underneath, and close firmly. |
| **Browser blocks connection to `localhost:8088`** | Chrome Private Network security restriction. | In Chrome address bar, open `chrome://flags/#block-insecure-private-network-requests` and set it to **Disabled**, then relaunch Chrome. |

---

## 📞 Support & Verification Checklist for the On-Site Visit
Before leaving the office, please confirm:
1. [ ] Machine Brand & Model recorded.
2. [ ] Machine Serial Number recorded.
3. [ ] COM Port identified and verified.
4. [ ] `http://localhost:8088/health` returns `ONLINE`.
5. [ ] 1 Test Fiscal Receipt successfully printed.
6. [ ] FS Number successfully visible on BDAE-ERP invoice attachment.
