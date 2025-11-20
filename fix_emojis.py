import re

# Read the file with UTF-8 encoding
with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Define emoji replacements (garbled text -> proper emoji)
emoji_map = {
    '≡ƒÄ¼': '🎬',
    '≡ƒÆ¼': '💬',
    '≡ƒñû': '🤖',
    '≡ƒô¥': '📝',
    '≡ƒôÑ': '📥',
    '≡ƒÄ¢∩╕Å': '🎞️',
    '≡ƒÄ▓': '🎲',
    '≡ƒô▒': '📱',
    '≡ƒöö': '🔔',
    'Γ¡É': '⭐',
    'ΓÅ│': '⏳',
    'Γû╝': '▼',
    '≡ƒæñ': '👤',
    '≡ƒÜ¬': '🚪',
    'Γ£û': '✕',
    '≡ƒì┐': '🍿',
    'Γ£¿': '✨',
    '≡ƒÜÇ': '🚀',
    '≡ƒÄ¡': '🎭',
    '≡ƒô║': '📺',
    '≡ƒÄÑ': '🎥',
    '≡ƒÆí': '💡',
    '≡ƒÄ¬': '🎪',
    '≡ƒºá': '🎚️',
    'Γÿ░': '🏆',
    '≡ƒÅå': '🏅',
    '≡ƒöÄ': '🔍',
    'ΓÇó': '•',
    'ΓÇÖ': ''',
    'ΓÇÖ': ''',
    'ΓÇ£': '"',
    'ΓÇ¥': '"',
    'Γ£à': '✅',
    'ΓÜá∩╕Å': '⚠️',
    'Γ¥î': '❌',
    'ΓÇ╣': '←',
    'ΓÇ¿': '→',
    'ΓÇ»': '↑',
    'ΓÇ╝': '↓',
}

# Replace all garbled emojis
for garbled, emoji in emoji_map.items():
    content = content.replace(garbled, emoji)

# Write back with UTF-8 encoding
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Emojis fixed successfully!")
print(f"📝 Replaced {len(emoji_map)} emoji patterns")
