"""
CeylonCare Food Dataset Preparation Script
==========================================

This script helps prepare an image dataset for food classification by:
1. Validating images (checking for corruption, low resolution, etc.)
2. Standardizing file names
3. Organizing into train/validation/test splits
4. Data augmentation
5. Analyzing the dataset distribution

Usage:
    python prepare_dataset.py --data_dir /path/to/food_images --output_dir /path/to/processed_data

Author: CeylonCare Team
"""

import os
import argparse
import shutil
import random
import numpy as np
import pandas as pd
from PIL import Image, ImageOps, ImageEnhance
import matplotlib.pyplot as plt
from tqdm import tqdm
import cv2
import imagehash
from concurrent.futures import ProcessPoolExecutor, as_completed
import json
from collections import defaultdict

# Set up argument parser
parser = argparse.ArgumentParser(description='Prepare food image dataset')
parser.add_argument('--data_dir', type=str, required=True, help='Path to data directory')
parser.add_argument('--output_dir', type=str, default='./processed_dataset', help='Path to save processed data')
parser.add_argument('--train_ratio', type=float, default=0.7, help='Ratio of data for training')
parser.add_argument('--val_ratio', type=float, default=0.15, help='Ratio of data for validation')
parser.add_argument('--test_ratio', type=float, default=0.15, help='Ratio of data for testing')
parser.add_argument('--min_images', type=int, default=20, help='Minimum images per class')
parser.add_argument('--max_images', type=int, default=1000, help='Maximum images per class')
parser.add_argument('--min_resolution', type=int, default=224, help='Minimum image resolution')
parser.add_argument('--augmentation', action='store_true', help='Perform data augmentation')
parser.add_argument('--augmentation_factor', type=int, default=3, help='Data augmentation multiplier')
parser.add_argument('--workers', type=int, default=4, help='Number of worker processes')
args = parser.parse_args()

# Create output directories
def create_output_dirs(output_dir):
    """Create the necessary output directories"""
    os.makedirs(output_dir, exist_ok=True)
    
    splits = ['train', 'val', 'test']
    for split in splits:
        os.makedirs(os.path.join(output_dir, split), exist_ok=True)
    
    return {split: os.path.join(output_dir, split) for split in splits}

def validate_image(img_path):
    """
    Validate if an image is usable for training:
    - Check if file is a valid image
    - Check minimum resolution
    - Check if image is not corrupt
    """
    try:
        img = Image.open(img_path)
        
        # Check if it's actually an image
        img.verify()
        
        # Open again after verify (verify closes the file)
        img = Image.open(img_path)
        
        # Check resolution
        width, height = img.size
        if width < args.min_resolution or height < args.min_resolution:
            return False, f"Resolution too low: {width}x{height}"
        
        # Check channels (must be RGB)
        if img.mode != 'RGB':
            # Try to convert to RGB
            img = img.convert('RGB')
        
        return True, img
    
    except Exception as e:
        return False, f"Invalid image: {str(e)}"

def check_for_duplicates(image_paths):
    """
    Check for duplicate or near-duplicate images using perceptual hashing
    """
    hashes = {}
    duplicates = defaultdict(list)
    
    print("Checking for duplicate images...")
    for img_path in tqdm(image_paths):
        try:
            img = Image.open(img_path)
            # Calculate perceptual hash
            img_hash = str(imagehash.phash(img))
            
            # Check if this hash already exists
            if img_hash in hashes:
                duplicates[hashes[img_hash]].append(img_path)
            else:
                hashes[img_hash] = img_path
        except Exception as e:
            print(f"Error processing {img_path}: {e}")
    
    # Report duplicates
    duplicate_count = sum(len(dups) for dups in duplicates.values())
    print(f"Found {duplicate_count} potential duplicate images")
    
    return duplicates

def normalize_filename(original_name, category, index):
    """Generate a standardized filename based on category and index"""
    extension = os.path.splitext(original_name)[1].lower()
    return f"{category}_{index:04d}{extension}"

def process_category(category_path, category_name, output_dirs):
    """Process a single food category"""
    results = {
        'category': category_name,
        'total_images': 0,
        'valid_images': 0,
        'invalid_images': 0,
        'train_images': 0,
        'val_images': 0,
        'test_images': 0,
        'augmented_images': 0,
        'error_files': []
    }
    
    # Get all image files
    image_files = [f for f in os.listdir(category_path) 
                  if f.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp'))]
    
    results['total_images'] = len(image_files)
    
    if len(image_files) < args.min_images:
        print(f"Warning: Category {category_name} has only {len(image_files)} images, which is below the minimum of {args.min_images}")
    
    # Validate images
    valid_images = []
    for img_file in image_files:
        img_path = os.path.join(category_path, img_file)
        is_valid, img_or_error = validate_image(img_path)
        
        if is_valid:
            results['valid_images'] += 1
            valid_images.append((img_path, img_file, img_or_error))
        else:
            results['invalid_images'] += 1
            results['error_files'].append((img_file, img_or_error))
    
    # Check for duplicates
    if len(valid_images) >= args.min_images:
        duplicate_groups = check_for_duplicates([item[0] for item in valid_images])
        
        # Remove duplicates from valid images list
        duplicate_paths = set()
        for original, duplicates in duplicate_groups.items():
            # Keep the original, remove the duplicates
            duplicate_paths.update(duplicates)
        
        # Filter out the duplicates
        valid_images = [item for item in valid_images if item[0] not in duplicate_paths]
        print(f"Removed {len(duplicate_paths)} duplicate images from {category_name}")
    
    # Limit to max_images if needed
    if len(valid_images) > args.max_images:
        print(f"Limiting category {category_name} from {len(valid_images)} to {args.max_images} images")
        random.shuffle(valid_images)
        valid_images = valid_images[:args.max_images]
    
    # Split the data
    random.shuffle(valid_images)
    
    # Calculate split sizes
    total = len(valid_images)
    train_size = int(total * args.train_ratio)
    val_size = int(total * args.val_ratio)
    test_size = total - train_size - val_size
    
    # Create splits
    train_images = valid_images[:train_size]
    val_images = valid_images[train_size:train_size+val_size]
    test_images = valid_images[train_size+val_size:]
    
    # Create category directories in each split
    for split in output_dirs:
        os.makedirs(os.path.join(output_dirs[split], category_name), exist_ok=True)
    
    # Copy images to appropriate splits with normalized filenames
    # Train set
    for i, (img_path, orig_filename, img) in enumerate(train_images):
        new_filename = normalize_filename(orig_filename, category_name, i)
        dest_path = os.path.join(output_dirs['train'], category_name, new_filename)
        # Use the already loaded image object to save in RGB mode
        img.save(dest_path)
    
    results['train_images'] = len(train_images)
    
    # Validation set
    for i, (img_path, orig_filename, img) in enumerate(val_images):
        new_filename = normalize_filename(orig_filename, category_name, i)
        dest_path = os.path.join(output_dirs['val'], category_name, new_filename)
        img.save(dest_path)
    
    results['val_images'] = len(val_images)
    
    # Test set
    for i, (img_path, orig_filename, img) in enumerate(test_images):
        new_filename = normalize_filename(orig_filename, category_name, i)
        dest_path = os.path.join(output_dirs['test'], category_name, new_filename)
        img.save(dest_path)
    
    results['test_images'] = len(test_images)
    
    # Perform data augmentation if requested and needed
    if args.augmentation and results['train_images'] < args.min_images:
        targets_per_image = max(1, args.min_images // results['train_images'])
        augmentation_count = 0
        
        for i, (img_path, orig_filename, img) in enumerate(train_images):
            # Create multiple augmented versions
            for j in range(targets_per_image):
                try:
                    # Apply augmentation techniques
                    aug_img = apply_augmentation(img)
                    
                    # Save augmented image
                    aug_filename = f"{category_name}_aug_{i}_{j}.jpg"
                    aug_path = os.path.join(output_dirs['train'], category_name, aug_filename)
                    aug_img.save(aug_path)
                    
                    augmentation_count += 1
                except Exception as e:
                    print(f"Error during augmentation: {e}")
        
        results['augmented_images'] = augmentation_count
    
    return results

def apply_augmentation(img):
    """Apply random augmentation to an image"""
    # Convert to RGB if not already
    if img.mode != 'RGB':
        img = img.convert('RGB')
    
    # Make a copy to avoid modifying the original
    img = img.copy()
    
    # Apply a random set of augmentations
    # 1. Random rotation
    if random.random() > 0.5:
        angle = random.uniform(-25, 25)
        img = img.rotate(angle, resample=Image.BICUBIC, expand=False)
    
    # 2. Random horizontal flip
    if random.random() > 0.5:
        img = ImageOps.mirror(img)
    
    # 3. Random brightness/contrast adjustment
    if random.random() > 0.5:
        factor = random.uniform(0.8, 1.2)
        enhancer = ImageEnhance.Brightness(img)
        img = enhancer.enhance(factor)
    
    if random.random() > 0.5:
        factor = random.uniform(0.8, 1.2)
        enhancer = ImageEnhance.Contrast(img)
        img = enhancer.enhance(factor)
    
    # 4. Random saturation adjustment
    if random.random() > 0.5:
        factor = random.uniform(0.8, 1.2)
        enhancer = ImageEnhance.Color(img)
        img = enhancer.enhance(factor)
    
    # 5. Random crop and resize
    if random.random() > 0.5:
        width, height = img.size
        crop_size = min(width, height) * random.uniform(0.8, 0.95)
        left = random.uniform(0, width - crop_size)
        top = random.uniform(0, height - crop_size)
        right = left + crop_size
        bottom = top + crop_size
        
        img = img.crop((left, top, right, bottom))
        img = img.resize((width, height), Image.BICUBIC)
    
    return img

def visualize_dataset(results, output_dir):
    """Generate visualizations of the dataset distribution"""
    # Create dataframe from results
    df = pd.DataFrame(results)
    
    # Bar chart of images per category
    plt.figure(figsize=(12, 8))
    ax = df.plot(x='category', y=['train_images', 'val_images', 'test_images'], 
                kind='bar', stacked=True)
    plt.title('Images per Food Category')
    plt.xlabel('Category')
    plt.ylabel('Number of Images')
    plt.xticks(rotation=45, ha='right')
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'category_distribution.png'))
    
    # Pie chart of train/val/test split
    plt.figure(figsize=(10, 10))
    total_splits = {
        'Train': df['train_images'].sum(),
        'Validation': df['val_images'].sum(),
        'Test': df['test_images'].sum()
    }
    plt.pie(total_splits.values(), labels=total_splits.keys(), autopct='%1.1f%%')
    plt.title('Dataset Split Distribution')
    plt.savefig(os.path.join(output_dir, 'split_distribution.png'))
    
    # Bar chart of valid vs invalid images
    plt.figure(figsize=(12, 6))
    df['invalid_ratio'] = df['invalid_images'] / df['total_images']
    df = df.sort_values('invalid_ratio', ascending=False)
    ax = df.plot(x='category', y=['valid_images', 'invalid_images'], 
                kind='bar', stacked=True)
    plt.title('Valid vs Invalid Images by Category')
    plt.xlabel('Category')
    plt.ylabel('Number of Images')
    plt.xticks(rotation=45, ha='right')
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'validity_distribution.png'))

def create_dataset_manifest(results, output_dir, split_dirs):
    """Create a manifest file with dataset information"""
    # Collect information about the splits
    split_info = {}
    for split, split_dir in split_dirs.items():
        split_info[split] = {
            'path': split_dir,
            'categories': {},
            'total_images': 0
        }
        
        # Get counts for each category in this split
        for category in os.listdir(split_dir):
            category_dir = os.path.join(split_dir, category)
            if os.path.isdir(category_dir):
                images = [f for f in os.listdir(category_dir) 
                         if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
                split_info[split]['categories'][category] = len(images)
                split_info[split]['total_images'] += len(images)
    
    # Create manifest
    manifest = {
        'dataset_name': 'CeylonCare Food Dataset',
        'creation_date': pd.Timestamp.now().strftime('%Y-%m-%d'),
        'source_directory': args.data_dir,
        'output_directory': args.output_dir,
        'splits': split_info,
        'categories': {}
    }
    
    # Add information about each category
    for result in results:
        manifest['categories'][result['category']] = {
            'total_original_images': result['total_images'],
            'valid_images': result['valid_images'],
            'invalid_images': result['invalid_images'],
            'train_images': result['train_images'],
            'val_images': result['val_images'],
            'test_images': result['test_images'],
            'augmented_images': result['augmented_images']
        }
    
    # Add overall statistics
    manifest['statistics'] = {
        'total_categories': len(manifest['categories']),
        'total_original_images': sum(r['total_images'] for r in results),
        'total_valid_images': sum(r['valid_images'] for r in results),
        'total_invalid_images': sum(r['invalid_images'] for r in results),
        'total_train_images': sum(r['train_images'] for r in results),
        'total_val_images': sum(r['val_images'] for r in results),
        'total_test_images': sum(r['test_images'] for r in results),
        'total_augmented_images': sum(r['augmented_images'] for r in results)
    }
    
    # Save manifest
    with open(os.path.join(output_dir, 'dataset_manifest.json'), 'w') as f:
        json.dump(manifest, f, indent=2)
    
    # Also save a CSV of category statistics
    stats_df = pd.DataFrame(results)
    stats_df.to_csv(os.path.join(output_dir, 'category_statistics.csv'), index=False)
    
    return manifest

def visualize_sample_images(output_dir, split_dirs, manifest):
    """Create a grid of sample images from each category"""
    # For each category, get sample images from train split
    categories = list(manifest['categories'].keys())
    
    # Limit to 25 categories maximum for visualization
    if len(categories) > 25:
        print(f"Limiting visualization to 25 categories out of {len(categories)}")
        categories = categories[:25]
    
    samples_per_category = 5
    
    # Create a grid of sample images
    grid_size = (len(categories), samples_per_category)
    fig, axes = plt.subplots(*grid_size, figsize=(samples_per_category*3, len(categories)*3))
    
    # Make axes 2D if it's 1D
    if len(categories) == 1:
        axes = [axes]
    
    # Get sample images for each category
    for i, category in enumerate(categories):
        # Get all images for this category in the train split
        category_dir = os.path.join(split_dirs['train'], category)
        if os.path.exists(category_dir):
            images = [f for f in os.listdir(category_dir) 
                     if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
            
            # Select random samples (or all if fewer than samples_per_category)
            if len(images) <= samples_per_category:
                samples = images
            else:
                samples = random.sample(images, samples_per_category)
            
            # Display each sample
            for j, img_file in enumerate(samples):
                if j < samples_per_category:
                    img_path = os.path.join(category_dir, img_file)
                    img = Image.open(img_path)
                    axes[i][j].imshow(img)
                    axes[i][j].axis('off')
                    
                    # Set title for the first column only
                    if j == 0:
                        axes[i][j].set_title(category, fontsize=10, loc='left')
    
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'sample_images_grid.png'))
    plt.close()

def main():
    print(f"Preparing food image dataset from {args.data_dir}")
    print(f"Output directory: {args.output_dir}")
    
    # Create output directories
    split_dirs = create_output_dirs(args.output_dir)
    
    # Get all categories (each subfolder is a category)
    categories = []
    for item in os.listdir(args.data_dir):
        item_path = os.path.join(args.data_dir, item)
        if os.path.isdir(item_path):
            categories.append((item_path, item))
    
    print(f"Found {len(categories)} food categories: {', '.join(cat[1] for cat in categories)}")
    
    # Process each category
    results = []
    
    if args.workers > 1:
        # Multiprocessing approach
        print(f"Processing with {args.workers} worker processes")
        with ProcessPoolExecutor(max_workers=args.workers) as executor:
            # Submit tasks
            futures = [executor.submit(process_category, cat_path, cat_name, split_dirs) 
                      for cat_path, cat_name in categories]
            
            # Process results as they complete
            for future in tqdm(as_completed(futures), total=len(futures), desc="Processing categories"):
                try:
                    result = future.result()
                    results.append(result)
                    print(f"Processed {result['category']}: {result['valid_images']} valid images")
                except Exception as e:
                    print(f"Error processing category: {e}")
    else:
        # Single process approach
        for cat_path, cat_name in tqdm(categories, desc="Processing categories"):
            try:
                result = process_category(cat_path, cat_name, split_dirs)
                results.append(result)
                print(f"Processed {result['category']}: {result['valid_images']} valid images")
            except Exception as e:
                print(f"Error processing {cat_name}: {e}")
    
    # Create dataset manifest
    manifest = create_dataset_manifest(results, args.output_dir, split_dirs)
    
    # Visualize dataset
    visualize_dataset(results, args.output_dir)
    
    # Visualize sample images
    visualize_sample_images(args.output_dir, split_dirs, manifest)
    
    # Print summary
    print("\nDataset preparation complete!")
    print(f"Total categories: {manifest['statistics']['total_categories']}")
    print(f"Total valid images: {manifest['statistics']['total_valid_images']}")
    print(f"Train images: {manifest['statistics']['total_train_images']}")
    print(f"Validation images: {manifest['statistics']['total_val_images']}")
    print(f"Test images: {manifest['statistics']['total_test_images']}")
    print(f"Augmented images: {manifest['statistics']['total_augmented_images']}")
    
    # Print info about categories with insufficient data
    low_data_categories = [cat for cat in manifest['categories'] 
                          if manifest['categories'][cat]['train_images'] < args.min_images]
    
    if low_data_categories:
        print(f"\nWarning: {len(low_data_categories)} categories have fewer than {args.min_images} train images:")
        for cat in low_data_categories:
            print(f"  - {cat}: {manifest['categories'][cat]['train_images']} train images")
        
        print("\nConsider collecting more data for these categories or using data augmentation.")
    
    print(f"\nOutput saved to {args.output_dir}")
    print(f"Dataset manifest: {os.path.join(args.output_dir, 'dataset_manifest.json')}")
    print(f"Category statistics: {os.path.join(args.output_dir, 'category_statistics.csv')}")

if __name__ == '__main__':
    main()