import xml.etree.ElementTree as ET
import os

tree = ET.parse(os.path.abspath('projects/project_1/reginfo_sparx-5i.cml'))
root = tree.getroot()

outputDir = "project_1"
os.makedirs(outputDir, exist_ok=True)

for target in root.iter('target'):
    target_name = target.attrib['name']

    if target_name:
        file_path = os.path.join(outputDir, f"{target_name}.xml")

        with open(file_path, "w" , encoding="utf-8") as file:

            file.write(f"=== DOCUMENTATION FOR TARGET: {target_name} ===\n\n")

            for sub_element in target.iter():
                text = sub_element.text.strip() if sub_element.text else ""

                if text:
                    sub_name = sub_element.get('name')
                    name_info = f" [{sub_name}]" if sub_name else ""

                    file.write(f"<{sub_element.tag}>{name_info}:\n{text}\n")
                    file.write("-" * 30 + "\n")

        print(f"Создан файл: {file_path}")

print("\nВсе файлы успешно созданы!")