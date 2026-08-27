import os
import glob
from pypdf import PdfReader

def extract_all_pdfs():
    pdf_dir = r"d:\larva_lens\docs"
    out_dir = r"d:\larva_lens\docs\extracted"
    os.makedirs(out_dir, exist_ok=True)
    
    pdf_files = glob.glob(os.path.join(pdf_dir, "*.pdf"))
    for pdf_path in sorted(pdf_files):
        base_name = os.path.splitext(os.path.basename(pdf_path))[0]
        out_txt_path = os.path.join(out_dir, f"{base_name}.txt")
        print(f"Extracting {base_name}...")
        try:
            reader = PdfReader(pdf_path)
            content = []
            for i, page in enumerate(reader.pages):
                page_text = page.extract_text() or ""
                content.append(f"--- PAGE {i+1} ---\n{page_text}")
            with open(out_txt_path, "w", encoding="utf-8") as f:
                f.write("\n\n".join(content))
            print(f"Saved: {out_txt_path} ({len(reader.pages)} pages)")
        except Exception as e:
            print(f"Error reading {pdf_path}: {e}")

if __name__ == "__main__":
    extract_all_pdfs()
