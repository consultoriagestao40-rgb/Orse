# -*- coding: utf-8 -*-
import os

filepath = "/Users/cristianosilva/.gemini/antigravity/scratch/orse/app/leads/LeadsKanban.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

target_str = """            </div>

          </div>
        </div>
      {customModal.isOpen && ("""

replacement_str = """            </div>

          </div>
        </div>
      )}

      {customModal.isOpen && ("""

if target_str in content:
    content = content.replace(target_str, replacement_str, 1)
    print("Final syntax fix applied successfully!")
else:
    # Try alternate newline structure
    target_str_alt = """            </div>\n\n          </div>\n        </div>\n      {customModal.isOpen && ("""
    replacement_str_alt = """            </div>\n\n          </div>\n        </div>\n      )}\n\n      {customModal.isOpen && ("""
    if target_str_alt in content:
        content = content.replace(target_str_alt, replacement_str_alt, 1)
        print("Final syntax fix applied successfully (alt)!")
    else:
        # Check if the block is already closed and this is a false alarm
        if "      )}\n\n      {customModal.isOpen && (" in content:
            print("Syntax is already correct.")
        else:
            print("Error: Target pattern not found!")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)
