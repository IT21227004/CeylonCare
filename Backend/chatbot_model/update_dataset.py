import pandas as pd

# Load the existing dataset
input_file = 'dataset_chatbot.csv'
output_file = 'dataset_chatbot_updated.csv'

# Read the dataset
df = pd.read_csv(input_file)

# Function to create condition-specific intents
def create_condition_specific_intent(row):
    base_intent = row['Intent']
    condition = row.get('Health Condition', row.get('Condition', 'general'))  # Prioritize Health Condition
    if pd.isna(condition) or condition == 'Unknown' or condition == 'Healthy':
        return base_intent.lower().replace(' ', '_')  # Keep original intent if no condition
    return f"{base_intent.lower().replace(' ', '_')}_for_{condition.lower().replace(' ', '_')}"

# Apply the function to create new intents
df['Intent'] = df.apply(create_condition_specific_intent, axis=1)

# Verify the changes
print("Sample of updated dataset:")
print(df.head().to_string())
print("\nUnique updated intents:")
print(df['Intent'].unique())

# Save the updated dataset
df.to_csv(output_file, index=False)
print(f"Updated dataset saved as {output_file}")