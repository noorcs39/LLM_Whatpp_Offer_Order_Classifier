#!/usr/bin/env python3
import json
import sys
from datetime import datetime

def view_all_messages():
    """View all WhatsApp messages including filtered ones"""
    try:
        # Read from all_messages.json
        with open('all_messages.json', 'r', encoding='utf-8') as f:
            messages = json.load(f)
        
        print(f"📱 Total WhatsApp Messages: {len(messages)}")
        print("=" * 60)
        
        # Display messages in reverse chronological order
        for i, msg in enumerate(reversed(messages[-20:])):  # Show last 20
            print(f"\n{i+1}. [{msg['timestamp']}] {msg.get('name', 'Unknown')} ({msg['number']})")
            print(f"   Message: {msg['message']}")
            if msg['translated'] != msg['message']:
                print(f"   Translated: {msg['translated']}")
            if msg['price']:
                print(f"   Price: {msg['price']}")
            if msg['image']:
                print(f"   Image: {msg['image']}")
            print(f"   Type: {msg['type']}")
            print("-" * 40)
    
    except FileNotFoundError:
        print("❌ all_messages.json not found. Waiting for new messages...")
        print("The file will be created automatically when new messages arrive.")
    except Exception as e:
        print(f"❌ Error reading messages: {e}")

def export_messages():
    """Export messages to different formats"""
    try:
        with open('all_messages.json', 'r', encoding='utf-8') as f:
            messages = json.load(f)
        
        # Export to CSV
        import csv
        with open('all_messages.csv', 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=['timestamp', 'number', 'name', 'message', 'translated', 'price', 'type'])
            writer.writeheader()
            for msg in messages:
                writer.writerow({
                    'timestamp': msg['timestamp'],
                    'number': msg['number'],
                    'name': msg.get('name', ''),
                    'message': msg['message'],
                    'translated': msg['translated'],
                    'price': msg.get('price', ''),
                    'type': msg['type']
                })
        
        print(f"✅ Exported {len(messages)} messages to all_messages.csv")
        
    except Exception as e:
        print(f"❌ Error exporting messages: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "export":
        export_messages()
    else:
        view_all_messages()