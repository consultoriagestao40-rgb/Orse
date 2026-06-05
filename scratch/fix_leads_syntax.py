# -*- coding: utf-8 -*-
import os

filepath = "/Users/cristianosilva/.gemini/antigravity/scratch/orse/app/leads/LeadsKanban.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Locate the end of showChatCenter and customModal
# Let's search for the end of LeadsKanban.tsx
# The end of the file is currently:
#             </div>
#           </div>
#         </div>
#       {customModal.isOpen && (
# ...
#       )}
# 
#     </div>
#   );
# }

target_str = """            </div>

          </div>
        </div>
      {customModal.isOpen && ("""

# Replace it with:
#             </div>
# 
#           </div>
#         </div>
#       )}
# 
#       {customModal.isOpen && (
replacement_str = """            </div>

          </div>
        </div>
      )}

      {customModal.isOpen && ("""

if target_str in content:
    content = content.replace(target_str, replacement_str, 1)
    print("Syntax fix applied successfully!")
else:
    # Try with single newlines
    target_str_alt = """            </div>\n          </div>\n        </div>\n      {customModal.isOpen && ("""
    replacement_str_alt = """            </div>\n          </div>\n        </div>\n      )}\n\n      {customModal.isOpen && ("""
    if target_str_alt in content:
        content = content.replace(target_str_alt, replacement_str_alt, 1)
        print("Syntax fix applied successfully (alt)!")
    else:
        print("Error: Target pattern not found in LeadsKanban.tsx!")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)
