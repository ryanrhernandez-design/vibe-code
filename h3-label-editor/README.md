# H3 Label Editor Simulator (rev C, 10.02.26)

A working browser simulator of the H3 fruit-label editor. It shows the label layout and generates real barcodes and QR codes:

- GS1 DataBar and DataBar Stacked
- UPC-A, UPC-E, EAN-13 and EAN-8
- Code 128 and GS1-128
- QR codes

The page also has the engineering controls, a 1-bit 300 dpi print preview, a test print and send-to-lanes.

**Open it:** https://ryanrhernandez-design.github.io/vibe-code/h3-label-editor/

**New in rev C:**

- All 24 Hurst label dies are starting shapes. New label and the Label library list them first, with a search box (die number, size or name).
- Each die uses its exact outline, so placement and printing follow notches, tabs and odd shapes.
- The die file name gives the size, e.g. `67_X_1 XF460WM.gif` = 0.67 × 1.00 in, die XF460. Engineering can import more die files.

**New in rev B:**

- Type any data into a barcode or QR code, or take the GTIN from the job.
- More barcode types. The barcode picker shows which ones fit the label.
- QR codes grow to fit their content.
- Backspace never deletes an item. Delete only works after you tap the label.
- A new label starts by picking the label shape. Engineering can add shapes.

**About the page:**

- The page is a single self-contained file (`index.html`). No install and no server are needed.
- Fonts load from Google Fonts. Everything else runs in the browser.
- Sample labels and customer names are demo data for the simulator.
- Third-party code and licences are in [THIRD-PARTY-NOTICES.txt](THIRD-PARTY-NOTICES.txt).
