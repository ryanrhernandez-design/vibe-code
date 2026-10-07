# H3 Label Editor Simulator (rev H, 10.07.26)

A working browser simulator of the H3 fruit-label editor. It shows the label layout and generates real barcodes and QR codes:

- GS1 DataBar and DataBar Stacked
- UPC-A, UPC-E, EAN-13 and EAN-8
- Code 128 and GS1-128
- QR codes

The page also has the engineering controls, a 1-bit 300 dpi print preview, a test print and send-to-lanes.

**Open it:** https://ryanrhernandez-design.github.io/vibe-code/h3-label-editor/

**New in rev H:** cropped GS1 DataBar. Bar widths go in half dots (3½ dots = the Auvil DataBar, 0.5831 in wide), and the height can be cropped down to 0.16 in, the smallest DataBar Hurst prints. Shorter asks first with a "not recommended" warning, and never goes below the GS1 minimum (13 × bar width). A DataBar that has to shrink is cropped before its bars get thinner.

**New in rev G:** connecting is one click. Ryan sends each person their own setup link (Label library → Label repository → Invite someone); opening it connects that computer with their name. Nothing to paste.

**New in rev F:** saving works on this public page. Labels go to the team's private label repository on GitHub, with full revision history (every save is a commit). Connect once in Label library → Label repository with the team's access token and your name. Without it, labels are saved in your browser.

**New in rev E:** a shared label repository with revision history.

**New in rev D:**

- DataBar bars and QR modules can go down to 2 dots, so they fit the Hurst dies. Each QR has its own module size.
- A new barcode or QR starts at the GS1 size and steps down only as far as the label needs. Anything below GS1 is flagged in the engineering checks.
- 10 sample labels on Hurst dies (5 QR codes, 5 GS1 DataBar Stacked) in the Label library.

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
