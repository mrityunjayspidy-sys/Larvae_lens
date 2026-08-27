import os
import shutil

extracted_dir = r"d:\larva_lens\docs\extracted"
docs_dir = r"d:\larva_lens\docs"

mapping = {
    "04_LarvaLens_PRD.txt": "01_PRD.md",
    "05_LarvaLens_TRD.txt": "02_TRD.md",
    "06_LarvaLens_App_Flow.txt": "03_APP_FLOW.md",
    "07_LarvaLens_UI_UX_Design_Brief.txt": "04_UI_UX.md",
    "08_LarvaLens_Backend_Schema.txt": "05_BACKEND_SCHEMA.md",
    "09_LarvaLens_Implementation_Plan.txt": "06_IMPLEMENTATION_PLAN.md"
}

for src_name, dst_name in mapping.items():
    src_path = os.path.join(extracted_dir, src_name)
    dst_path = os.path.join(docs_dir, dst_name)
    if os.path.exists(src_path):
        with open(src_path, "r", encoding="utf-8") as f:
            content = f.read()
        with open(dst_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Generated {dst_name}")
