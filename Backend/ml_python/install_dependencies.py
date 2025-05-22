import subprocess
import sys
import os

def install_requirements():
    """Install Python dependencies"""
    try:
        print("📦 Installing Python dependencies...")
        
        # Install requirements
        subprocess.check_call([
            sys.executable, "-m", "pip", "install", "-r", "requirements.txt"
        ])
        
        print("✅ Python dependencies installed successfully")
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        return False

def setup_directories():
    """Create necessary directories"""
    dirs = ['ml_models', 'ml_data', 'documents']
    
    for dir_name in dirs:
        os.makedirs(dir_name, exist_ok=True)
        print(f"📁 Created directory: {dir_name}")

if __name__ == "__main__":
    print("🚀 Setting up Sri Lankan Food ML System...")
    
    setup_directories()
    
    if install_requirements():
        print("\n✅ Setup completed successfully!")
        print("📋 Next steps:")
        print("1. Place your DOCX files in the documents/ folder:")
        print("   - categorization_of_foods.docx")
        print("   - food_item_recipes.docx")
        print("2. Call the /api/ml/setup endpoint to train models")
        print("3. Start using ML recommendations!")
    else:
        print("\n❌ Setup failed. Please check Python installation.")