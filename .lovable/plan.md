# Relabel the header Scrapbook button to "Gallery"

In the memory card header, the "View Scrapbook" button (now sitting next to "+ Log") currently reads "Scrapbook", which duplicates the card title. Rename it to **"Gallery"**.

## Change (`src/components/CustomLogByTypeView.tsx`)
- In `TypeCard`, change the memory button label text from `Scrapbook` to `Gallery`. The `Images` icon, navigation target (`/custom/memories?type=<id>`), and styling stay the same.
