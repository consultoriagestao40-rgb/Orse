import os

filepath = "/Users/cristianosilva/.gemini/antigravity/scratch/orse/app/propostas/nova/page.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Replace double quoted placeholder URL with JSX variable
old_str = '"https://via.placeholder.com/300x80?text=Silva+Consultoria"'
new_str = '{companyLogo}'

count = content.count(old_str)
print(f"Found {count} occurrences of {old_str}")

new_content = content.replace(old_str, new_str)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Replacement complete successfully!")
