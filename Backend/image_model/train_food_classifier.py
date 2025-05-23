"""
CeylonCare Food Classification Model Training Script
====================================================

This script trains a food image classification model using TensorFlow and 
transfer learning with MobileNetV2. It's designed to work with a dataset 
organized in folders by food category.

Usage:
    python train_food_classifier.py --data_dir /path/to/food_images --epochs 30

Author: CeylonCare Team
"""

import os
import argparse
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras import layers, models, optimizers
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping, ReduceLROnPlateau
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
import seaborn as sns
import json
from datetime import datetime
import csv

# Set up argument parser
parser = argparse.ArgumentParser(description='Train food classification model')
parser.add_argument('--data_dir', type=str, required=True, help='Path to data directory')
parser.add_argument('--output_dir', type=str, default='./models', help='Path to save models')
parser.add_argument('--img_size', type=int, default=224, help='Image size')
parser.add_argument('--batch_size', type=int, default=32, help='Batch size')
parser.add_argument('--epochs', type=int, default=20, help='Number of epochs')
parser.add_argument('--fine_tune_epochs', type=int, default=10, help='Number of fine-tuning epochs')
parser.add_argument('--learning_rate', type=float, default=0.001, help='Initial learning rate')
parser.add_argument('--fine_tune_lr', type=float, default=0.0001, help='Fine-tuning learning rate')
args = parser.parse_args()

# Ensure output directory exists
os.makedirs(args.output_dir, exist_ok=True)

def prepare_dataset(data_dir, img_size, batch_size):
    """
    Prepare and load the dataset from pre-split directory structure
    Expected structure:
    data_dir/
    ├── train/
    │   ├── category1/
    │   ├── category2/
    │   └── ...
    ├── val/
    │   ├── category1/
    │   ├── category2/
    │   └── ...
    └── test/
        ├── category1/
        ├── category2/
        └── ...
    """
    print("Preparing pre-split dataset...")
    
    # Check if the expected split directories exist
    train_dir = os.path.join(data_dir, 'train')
    val_dir = os.path.join(data_dir, 'val')
    test_dir = os.path.join(data_dir, 'test')
    
    if not all(os.path.exists(d) for d in [train_dir, val_dir, test_dir]):
        raise ValueError(f"Expected train/, val/, and test/ directories in {data_dir}")
    
    # Get categories from train directory
    categories = [d for d in os.listdir(train_dir) 
                 if os.path.isdir(os.path.join(train_dir, d))]
    
    if not categories:
        raise ValueError(f"No categories found in {train_dir}")
    
    print(f"Found categories: {categories}")
    
    # Count images in each split
    split_counts = {}
    total_images = 0
    
    for split_name, split_dir in [('train', train_dir), ('val', val_dir), ('test', test_dir)]:
        split_counts[split_name] = {}
        split_total = 0
        
        for category in categories:
            category_path = os.path.join(split_dir, category)
            if os.path.exists(category_path):
                image_files = [f for f in os.listdir(category_path) 
                             if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
                count = len(image_files)
                split_counts[split_name][category] = count
                split_total += count
            else:
                split_counts[split_name][category] = 0
        
        split_counts[split_name]['total'] = split_total
        total_images += split_total
        print(f"{split_name.title()} set: {split_total} images")
    
    print(f"Total images: {total_images}")
    
    # Create class distribution visualization
    import pandas as pd
    import matplotlib.pyplot as plt
    
    # Create DataFrame for visualization
    viz_data = []
    for category in categories:
        for split in ['train', 'val', 'test']:
            viz_data.append({
                'category': category,
                'split': split,
                'count': split_counts[split][category]
            })
    
    viz_df = pd.DataFrame(viz_data)
    
    # Plot class distribution
    pivot_df = viz_df.pivot(index='category', columns='split', values='count').fillna(0)
    
    plt.figure(figsize=(12, 8))
    ax = pivot_df.plot(kind='bar', stacked=True)
    plt.title('Images per Food Category by Split')
    plt.xlabel('Category')
    plt.ylabel('Number of Images')
    plt.xticks(rotation=45, ha='right')
    plt.tight_layout()
    plt.savefig(os.path.join(args.output_dir, 'class_distribution.png'))
    plt.close()
    
    # Create data generators
    train_datagen = ImageDataGenerator(
        rescale=1./255,
        rotation_range=30,
        width_shift_range=0.2,
        height_shift_range=0.2,
        shear_range=0.2,
        zoom_range=0.2,
        horizontal_flip=True,
        fill_mode='nearest'
    )

    # For validation and test, we only rescale
    val_datagen = ImageDataGenerator(rescale=1./255)
    test_datagen = ImageDataGenerator(rescale=1./255)

    # Create generators
    train_generator = train_datagen.flow_from_directory(
        train_dir,
        target_size=(img_size, img_size),
        batch_size=batch_size,
        class_mode='categorical',
        shuffle=True
    )

    validation_generator = val_datagen.flow_from_directory(
        val_dir,
        target_size=(img_size, img_size),
        batch_size=batch_size,
        class_mode='categorical',
        shuffle=False
    )
    
    test_generator = test_datagen.flow_from_directory(
        test_dir,
        target_size=(img_size, img_size),
        batch_size=batch_size,
        class_mode='categorical',
        shuffle=False
    )

    # Get class names and indices
    class_indices = train_generator.class_indices
    class_names = list(class_indices.keys())
    num_classes = len(class_names)
    
    print(f"Found {num_classes} classes: {class_names}")
    
    # Save class indices for deployment
    label_map = {v: k for k, v in class_indices.items()}
    with open(os.path.join(args.output_dir, 'food_labels.json'), 'w') as f:
        json.dump(label_map, f, indent=2)
        
    return train_generator, validation_generator, test_generator, num_classes, class_names

def build_model(num_classes, img_size, learning_rate):
    """
    Build and compile the model using transfer learning with MobileNetV2
    """
    print("Building model...")
    
    # Create base model from MobileNetV2
    base_model = MobileNetV2(
        weights='imagenet',
        include_top=False,
        input_shape=(img_size, img_size, 3)
    )
    
    # Freeze the base model
    base_model.trainable = False
    
    # Create the model architecture
    model = models.Sequential([
        base_model,
        layers.GlobalAveragePooling2D(),
        layers.Dropout(0.2),
        layers.Dense(512, activation='relu'),
        layers.Dropout(0.3),
        layers.Dense(num_classes, activation='softmax')
    ])
    
    # Compile the model
    model.compile(
        optimizer=optimizers.Adam(learning_rate=learning_rate),
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    
    # Print model summary
    model.summary()
    
    # Save model architecture diagram
    tf.keras.utils.plot_model(
        model, 
        to_file=os.path.join(args.output_dir, 'model_architecture.png'),
        show_shapes=True
    )
    
    return model, base_model

def train_model(model, train_generator, validation_generator, epochs, batch_size):
    """
    Train the model with callbacks for checkpointing and early stopping
    """
    print("Training model...")
    
    # Define callbacks
    callbacks = [
        ModelCheckpoint(
            filepath=os.path.join(args.output_dir, 'model_checkpoint.h5'),
            monitor='val_accuracy',
            save_best_only=True,
            mode='max',
            verbose=1
        ),
        EarlyStopping(
            monitor='val_accuracy',
            patience=5,
            restore_best_weights=True,
            verbose=1
        ),
        ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.2,
            patience=3,
            min_lr=0.00001,
            verbose=1
        )
    ]
    
    # Train the model
    history = model.fit(
        train_generator,
        steps_per_epoch=len(train_generator),
        epochs=epochs,
        validation_data=validation_generator,
        validation_steps=len(validation_generator),
        callbacks=callbacks
    )
    
    return history

def fine_tune_model(model, base_model, train_generator, validation_generator, initial_epochs, fine_tune_epochs, fine_tune_lr):
    """
    Fine-tune the model by unfreezing some layers of the base model
    """
    print("Fine-tuning model...")
    
    # Unfreeze the top layers of the base model
    base_model.trainable = True
    
    # Freeze all the layers except the last 30
    for layer in base_model.layers[:-30]:
        layer.trainable = False
        
    # Recompile with a lower learning rate
    model.compile(
        optimizer=optimizers.Adam(learning_rate=fine_tune_lr),
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    
    # Define callbacks for fine-tuning
    callbacks = [
        ModelCheckpoint(
            filepath=os.path.join(args.output_dir, 'fine_tuned_model.h5'),
            monitor='val_accuracy',
            save_best_only=True,
            mode='max',
            verbose=1
        ),
        EarlyStopping(
            monitor='val_accuracy',
            patience=5,
            restore_best_weights=True,
            verbose=1
        ),
        ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.2,
            patience=3,
            min_lr=0.000001,
            verbose=1
        )
    ]
    
    # Continue training with fine-tuning
    total_epochs = initial_epochs + fine_tune_epochs
    
    history_fine = model.fit(
        train_generator,
        steps_per_epoch=len(train_generator),
        epochs=total_epochs,
        initial_epoch=initial_epochs,
        validation_data=validation_generator,
        validation_steps=len(validation_generator),
        callbacks=callbacks
    )
    
    return history_fine

def plot_training_history(history, fine_tune_history=None):
    """
    Plot the training and validation accuracy/loss
    """
    print("Plotting training history...")
    
    # Extract metrics
    acc = history.history['accuracy']
    val_acc = history.history['val_accuracy']
    loss = history.history['loss']
    val_loss = history.history['val_loss']
    
    # If fine-tuning history is provided, concatenate the metrics
    if fine_tune_history:
        acc += fine_tune_history.history['accuracy']
        val_acc += fine_tune_history.history['val_accuracy']
        loss += fine_tune_history.history['loss']
        val_loss += fine_tune_history.history['val_loss']
        
        # Mark the point where fine-tuning started
        fine_tune_epoch = len(history.history['accuracy'])
    
    # Save training history for later analysis
    complete_history = {
        'accuracy': acc,
        'val_accuracy': val_acc,
        'loss': loss,
        'val_loss': val_loss
    }
    
    with open(os.path.join(args.output_dir, 'training_history.json'), 'w') as f:
        json.dump(complete_history, f, indent=2)
    
    # Create figure for accuracy
    plt.figure(figsize=(12, 4))
    
    # Plot accuracy
    plt.subplot(1, 2, 1)
    plt.plot(acc, label='Training Accuracy')
    plt.plot(val_acc, label='Validation Accuracy')
    
    # Mark fine-tuning if applicable
    if fine_tune_history:
        plt.plot([fine_tune_epoch-1, fine_tune_epoch-1], plt.ylim(), 'k--')
        plt.text(fine_tune_epoch, plt.ylim()[0], 'Start Fine Tuning', verticalalignment='bottom')
    
    plt.xlabel('Epoch')
    plt.ylabel('Accuracy')
    plt.title('Training and Validation Accuracy')
    plt.legend()
    
    # Plot loss
    plt.subplot(1, 2, 2)
    plt.plot(loss, label='Training Loss')
    plt.plot(val_loss, label='Validation Loss')
    
    # Mark fine-tuning if applicable
    if fine_tune_history:
        plt.plot([fine_tune_epoch-1, fine_tune_epoch-1], plt.ylim(), 'k--')
        plt.text(fine_tune_epoch, plt.ylim()[0], 'Start Fine Tuning', verticalalignment='bottom')
    
    plt.xlabel('Epoch')
    plt.ylabel('Loss')
    plt.title('Training and Validation Loss')
    plt.legend()
    
    plt.tight_layout()
    plt.savefig(os.path.join(args.output_dir, 'training_plots.png'))
    plt.close()
    
def evaluate_model(model, test_generator, class_names):
    """
    Evaluate the model on the test set
    """
    print("Evaluating model...")
    
    # Evaluate model
    evaluation = model.evaluate(test_generator)
    print(f"Test Loss: {evaluation[0]:.4f}")
    print(f"Test Accuracy: {evaluation[1]:.4f}")
    
    # Get predictions
    test_generator.reset()
    predictions = model.predict(test_generator)
    y_pred = np.argmax(predictions, axis=1)
    y_true = test_generator.classes
    
    # Generate classification report
    report = classification_report(y_true, y_pred, target_names=class_names, output_dict=True)
    
    # Save classification report
    with open(os.path.join(args.output_dir, 'classification_report.json'), 'w') as f:
        json.dump(report, f, indent=2)
    
    # Create confusion matrix
    cm = confusion_matrix(y_true, y_pred)
    
    # Plot confusion matrix
    plt.figure(figsize=(15, 12))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=class_names, yticklabels=class_names)
    plt.xlabel('Predicted')
    plt.ylabel('True')
    plt.title('Confusion Matrix')
    plt.tight_layout()
    plt.savefig(os.path.join(args.output_dir, 'confusion_matrix.png'))
    plt.close()
    
    # Return evaluation metrics
    metrics = {
        'test_loss': float(evaluation[0]),
        'test_accuracy': float(evaluation[1]),
        'f1_macro': float(report['macro avg']['f1-score']),
        'precision_macro': float(report['macro avg']['precision']),
        'recall_macro': float(report['macro avg']['recall'])
    }
    
    return metrics

def convert_to_tflite(model, output_dir):
    """
    Convert the model to TensorFlow Lite format for mobile deployment
    """
    print("Converting model to TensorFlow Lite...")
    
    # Convert to TF Lite
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    tflite_model = converter.convert()
    
    # Save the TF Lite model
    with open(os.path.join(output_dir, 'food_classifier.tflite'), 'wb') as f:
        f.write(tflite_model)
    
    # Convert with optimization
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    tflite_optimized = converter.convert()
    
    # Save the optimized model
    with open(os.path.join(output_dir, 'food_classifier_optimized.tflite'), 'wb') as f:
        f.write(tflite_optimized)
    
    # Quantize to float16
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    converter.target_spec.supported_types = [tf.float16]
    tflite_f16 = converter.convert()
    
    # Save the quantized model
    with open(os.path.join(output_dir, 'food_classifier_f16.tflite'), 'wb') as f:
        f.write(tflite_f16)
    
    # Print model sizes
    print(f"Original TFLite model size: {len(tflite_model) / 1024:.2f} KB")
    print(f"Optimized TFLite model size: {len(tflite_optimized) / 1024:.2f} KB")
    print(f"Float16 quantized model size: {len(tflite_f16) / 1024:.2f} KB")
    
    return {
        'original_size_kb': len(tflite_model) / 1024,
        'optimized_size_kb': len(tflite_optimized) / 1024, 
        'float16_size_kb': len(tflite_f16) / 1024
    }

def main():
    """
    Main function to run the training pipeline
    """
    print(f"TensorFlow version: {tf.__version__}")
    gpu_devices = tf.config.list_physical_devices("GPU")
    print(f"GPU available: {len(gpu_devices) > 0}")

    
    # Start time
    start_time = datetime.now()
    print(f"Training started at: {start_time}")
    
    # Prepare dataset
    train_generator, validation_generator, test_generator, num_classes, class_names = prepare_dataset(
        args.data_dir, args.img_size, args.batch_size
    )
    
    # Build model
    model, base_model = build_model(num_classes, args.img_size, args.learning_rate)
    
    # Initial training
    history = train_model(
        model, train_generator, validation_generator, args.epochs, args.batch_size
    )
    
    # Fine-tuning
    fine_tune_history = fine_tune_model(
        model, base_model, train_generator, validation_generator, 
        args.epochs, args.fine_tune_epochs, args.fine_tune_lr
    )
    
    # Plot training history
    plot_training_history(history, fine_tune_history)
    
    # Evaluate the model
    metrics = evaluate_model(model, test_generator, class_names)
    
    # Convert to TFLite for mobile deployment
    tflite_metrics = convert_to_tflite(model, args.output_dir)
    
    # Save the final model
    model.save(os.path.join(args.output_dir, 'food_classifier_final.h5'))
    print(f"✅ Final model saved: {os.path.join(args.output_dir, 'food_classifier_final.h5')}")
    
    # End time
    end_time = datetime.now()
    training_time = end_time - start_time
    
    # Save training metadata
    metadata = {
        'training_start': start_time.isoformat(),
        'training_end': end_time.isoformat(),
        'training_duration_seconds': training_time.total_seconds(),
        'tensorflow_version': tf.__version__,
        'num_classes': num_classes,
        'class_names': class_names,
        'img_size': args.img_size,
        'batch_size': args.batch_size,
        'initial_epochs': args.epochs,
        'fine_tune_epochs': args.fine_tune_epochs,
        'learning_rate': args.learning_rate,
        'fine_tune_lr': args.fine_tune_lr,
        'metrics': metrics,
        'tflite_metrics': tflite_metrics
    }
    
    with open(os.path.join(args.output_dir, 'training_metadata.json'), 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print("\n" + "="*60)
    print("🎉 TRAINING COMPLETED SUCCESSFULLY!")
    print("="*60)
    print(f"⏱️  Training time: {training_time}")
    print(f"🎯 Final test accuracy: {metrics['test_accuracy']:.2%}")
    print(f"📁 All outputs saved to: {args.output_dir}")
    print(f"🚀 Model ready for Flask server deployment!")
    print("="*60)

if __name__ == '__main__':
    main()