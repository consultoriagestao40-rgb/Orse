with open('app/propostas/nova/page.tsx', 'r') as f:
    lines = f.readlines()

for i in range(5968, 5985):
    print(f"Line {i+1}: {repr(lines[i])}")
