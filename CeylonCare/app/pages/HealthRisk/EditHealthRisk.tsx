import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, StyleSheet, TouchableOpacity,
    ScrollView, SafeAreaView, StatusBar, Alert, ActivityIndicator
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { RadioButton } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FormData {
    userId: string;
    username: string;
    age: string;
    weight: string;
    height: string;
    bmi: string;
    gender: string;
    heartDisease: string;
    avgGlucoseLevel: string;
    bloodGlucoseLevel: string;
    hba1cLevel: string;
    smokingStatus: string;
    workType: string;
    residenceType: string;
    hypertension: string;
    diabetes: string;
}

const EditHealthRisk = ({ route, navigation }: any) => {
    const { riskData } = route.params;
    const [formData, setFormData] = useState<FormData>({
        userId: riskData.userId || '',
        username: riskData.username || '',
        age: riskData.age || '',
        weight: riskData.weight || '',
        height: riskData.height || '',
        bmi: riskData.bmi || '',
        gender: riskData.gender || '',
        heartDisease: riskData.heartDisease || '0',
        avgGlucoseLevel: riskData.avgGlucoseLevel || '',
        bloodGlucoseLevel: riskData.bloodGlucoseLevel || '',
        hba1cLevel: riskData.hba1cLevel || '',
        smokingStatus: riskData.smokingStatus || 'never smoked',
        workType: riskData.workType || '',
        residenceType: riskData.residenceType || '',
        hypertension: riskData.hypertension || '0',
        diabetes: riskData.diabetes || '0',
    });

    const [warnings, setWarnings] = useState<string[]>([]);
    const [diabetesResult, setDiabetesResult] = useState<string>('');
    const [hypertensionResult, setHypertensionResult] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);

    useEffect(() => {
        calculateBMI();
    }, [formData.height, formData.weight]);

    const calculateBMI = () => {
        const height = parseFloat(formData.height);
        const weight = parseFloat(formData.weight);

        if (height > 0 && weight > 0) {
            const bmi = (weight / (height * height)).toFixed(2);
            setFormData(prev => ({ ...prev, bmi }));
        }
    };

    const handleInputChange = (name: keyof FormData, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validateForm = (): boolean => {
        const newWarnings: string[] = [];

        if (parseFloat(formData.age) <= 0 || parseFloat(formData.age) > 120) {
            newWarnings.push("⚠ Age must be between 1 and 120.");
        }

        if (parseFloat(formData.weight) <= 0 || parseFloat(formData.weight) > 300) {
            newWarnings.push("⚠ Weight must be between 1 and 300 kg.");
        }

        if (parseFloat(formData.height) <= 0.5 || parseFloat(formData.height) > 2.5) {
            newWarnings.push("⚠ Height must be between 0.5 and 2.5 meters.");
        }

        if (parseFloat(formData.avgGlucoseLevel) <= 20 || parseFloat(formData.avgGlucoseLevel) > 600) {
            newWarnings.push("⚠ Average glucose level is medically impossible.");
        }

        if (parseFloat(formData.bloodGlucoseLevel) < 2 || parseFloat(formData.bloodGlucoseLevel) > 30) {
            newWarnings.push("⚠ Blood Glucose Level must be between 2 and 30 mmol/L.");
        }

        if (parseFloat(formData.hba1cLevel) < 2 || parseFloat(formData.hba1cLevel) > 20) {
            newWarnings.push("⚠ HbA1c Level must be between 2% and 20%.");
        }

        setWarnings(newWarnings);
        return newWarnings.length === 0;
    };

    const calculateHypertensionRisk = () => {
        // Simplified risk calculation logic for hypertension
        let riskLevel = "Low Risk";

        // Basic hypertension risk assessment
        if (formData.smokingStatus === "smokes") {
            riskLevel = "High Risk";
        } else if (parseFloat(formData.age) > 65) {
            riskLevel = "Medium Risk";
        } else if (formData.heartDisease === "1") {
            riskLevel = "High Risk";
        }

        setHypertensionResult(`Hypertension Risk: ${riskLevel}`);
        return riskLevel;
    };

    const calculateDiabetesRisk = () => {
        let riskScore = 0;
        let riskLevel = "Low Risk";

        // Simplified diabetes risk calculation
        if (parseFloat(formData.hba1cLevel) >= 6.5) {
            riskLevel = "High Risk";
        } else if (parseFloat(formData.hba1cLevel) >= 5.7) {
            riskLevel = "Medium Risk";
        }

        if (parseFloat(formData.bloodGlucoseLevel) >= 7.0) {
            riskLevel = "High Risk";
        } else if (parseFloat(formData.bloodGlucoseLevel) >= 5.6) {
            riskLevel = "Medium Risk";
        }

        if (riskLevel === "Low Risk") {
            if (parseFloat(formData.age) > 60) riskScore++;
            if (formData.hypertension === "1") riskScore++;
            if (formData.heartDisease === "1") riskScore++;
            if (formData.smokingStatus === "formerly smoked") riskScore++;
            if (formData.smokingStatus === "smokes") riskScore += 2;
            if (parseFloat(formData.bmi) > 25) riskScore += 2;
            if (parseFloat(formData.bmi) > 30) riskScore += 3;

            if (riskScore >= 5) riskLevel = "High Risk";
            else if (riskScore >= 3) riskLevel = "Medium Risk";
            else if (riskScore === 0) riskLevel = "No Risk";
        }

        setDiabetesResult(`Diabetes Risk: ${riskLevel}`);
        return riskLevel;
    };

    const handleSubmit = async () => {
        if (validateForm()) {
            setIsLoading(true);
            try {
                // We don't need to calculate risk levels here as the backend will handle it
                // Just prepare the data to send
                const updatedData = {
                    ...formData
                };

                const response = await fetch(`http:/192.168.60.22:5000/riskassessment/${riskData.id}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(updatedData),
                });

                const responseData = await response.json();

                if (response.ok) {
                    Alert.alert(
                        "Success",
                        "Health risk assessment updated successfully",
                        [
                            {
                                text: "OK",
                                onPress: () => navigation.navigate("ViewHealthRisk")
                            }
                        ]
                    );
                } else {
                    throw new Error(responseData.error || "Failed to update health risk assessment");
                }
            } catch (error: any) {
                console.error("Error updating health risk assessment:", error.message);
                Alert.alert("Error", error.message);
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.container}>
                <Text style={styles.title}>Edit Health Risk Assessment</Text>

                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#004d40" />
                        <Text style={styles.loadingText}>Updating your health risk assessment...</Text>
                    </View>
                ) : (
                    <ScrollView style={styles.formContainer}>
                        {/* Basic Information */}
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Basic Information</Text>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Age (years):</Text>
                            <TextInput
                                style={styles.input}
                                keyboardType="numeric"
                                value={formData.age}
                                onChangeText={(value) => handleInputChange('age', value)}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Gender:</Text>
                            <View style={styles.radioGroup}>
                                <RadioButton.Group
                                    value={formData.gender}
                                    onValueChange={(value: string) => handleInputChange('gender', value)}
                                >
                                    <View style={styles.radioOption}>
                                        <RadioButton value="Male" />
                                        <Text>Male</Text>
                                    </View>
                                    <View style={styles.radioOption}>
                                        <RadioButton value="Female" />
                                        <Text>Female</Text>
                                    </View>
                                </RadioButton.Group>
                            </View>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Weight (kg):</Text>
                            <TextInput
                                style={styles.input}
                                keyboardType="numeric"
                                value={formData.weight}
                                onChangeText={(value) => handleInputChange('weight', value)}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Height (m):</Text>
                            <TextInput
                                style={styles.input}
                                keyboardType="numeric"
                                value={formData.height}
                                onChangeText={(value) => handleInputChange('height', value)}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>BMI (auto-calculated):</Text>
                            <TextInput
                                style={[styles.input, styles.readonlyInput]}
                                value={formData.bmi}
                                editable={false}
                            />
                        </View>

                        {/* Medical History */}
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Medical History</Text>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Heart Disease:</Text>
                            <View style={styles.radioGroup}>
                                <RadioButton.Group
                                    value={formData.heartDisease}
                                    onValueChange={(value: string) => handleInputChange('heartDisease', value)}
                                >
                                    <View style={styles.radioOption}>
                                        <RadioButton value="0" />
                                        <Text>No</Text>
                                    </View>
                                    <View style={styles.radioOption}>
                                        <RadioButton value="1" />
                                        <Text>Yes</Text>
                                    </View>
                                </RadioButton.Group>
                            </View>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Hypertension:</Text>
                            <View style={styles.radioGroup}>
                                <RadioButton.Group
                                    value={formData.hypertension}
                                    onValueChange={(value: string) => handleInputChange('hypertension', value)}
                                >
                                    <View style={styles.radioOption}>
                                        <RadioButton value="0" />
                                        <Text>No</Text>
                                    </View>
                                    <View style={styles.radioOption}>
                                        <RadioButton value="1" />
                                        <Text>Yes</Text>
                                    </View>
                                </RadioButton.Group>
                            </View>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Diabetes:</Text>
                            <View style={styles.radioGroup}>
                                <RadioButton.Group
                                    value={formData.diabetes}
                                    onValueChange={(value: string) => handleInputChange('diabetes', value)}
                                >
                                    <View style={styles.radioOption}>
                                        <RadioButton value="0" />
                                        <Text>No</Text>
                                    </View>
                                    <View style={styles.radioOption}>
                                        <RadioButton value="1" />
                                        <Text>Yes</Text>
                                    </View>
                                </RadioButton.Group>
                            </View>
                        </View>

                        {/* Lifestyle */}
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Lifestyle</Text>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Smoking Status:</Text>
                            <Picker
                                selectedValue={formData.smokingStatus}
                                onValueChange={(value: string) => handleInputChange('smokingStatus', value)}
                                style={styles.picker}
                            >
                                <Picker.Item label="Smokes" value="smokes" />
                                <Picker.Item label="Formerly Smoked" value="formerly smoked" />
                                <Picker.Item label="Never Smoked" value="never smoked" />
                            </Picker>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Work Type:</Text>
                            <Picker
                                selectedValue={formData.workType}
                                onValueChange={(value: string) => handleInputChange('workType', value)}
                                style={styles.picker}
                            >
                                <Picker.Item label="Select" value="" />
                                <Picker.Item label="Private" value="Private" />
                                <Picker.Item label="Self-employed" value="Self-employed" />
                                <Picker.Item label="Government Job" value="Govt_job" />
                                <Picker.Item label="Children" value="children" />
                            </Picker>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Residence Type:</Text>
                            <Picker
                                selectedValue={formData.residenceType}
                                onValueChange={(value: string) => handleInputChange('residenceType', value)}
                                style={styles.picker}
                            >
                                <Picker.Item label="Select" value="" />
                                <Picker.Item label="Urban" value="Urban" />
                                <Picker.Item label="Rural" value="Rural" />
                            </Picker>
                        </View>

                        {/* Glucose Measurements */}
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Glucose Measurements</Text>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Average Glucose Level (mg/dL):</Text>
                            <TextInput
                                style={styles.input}
                                keyboardType="numeric"
                                value={formData.avgGlucoseLevel}
                                onChangeText={(value) => handleInputChange('avgGlucoseLevel', value)}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Blood Glucose Level (mmol/L):</Text>
                            <TextInput
                                style={styles.input}
                                keyboardType="numeric"
                                value={formData.bloodGlucoseLevel}
                                onChangeText={(value) => handleInputChange('bloodGlucoseLevel', value)}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>HbA1c Level (%):</Text>
                            <TextInput
                                style={styles.input}
                                keyboardType="numeric"
                                value={formData.hba1cLevel}
                                onChangeText={(value) => handleInputChange('hba1cLevel', value)}
                            />
                        </View>

                        <View style={styles.actionButtons}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => navigation.goBack()}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.updateButton}
                                onPress={handleSubmit}
                            >
                                <Text style={styles.updateButtonText}>Update Assessment</Text>
                            </TouchableOpacity>
                        </View>

                        {warnings.length > 0 && (
                            <View style={styles.warningsContainer}>
                                {warnings.map((warning, index) => (
                                    <Text key={index} style={styles.warningText}>{warning}</Text>
                                ))}
                            </View>
                        )}

                        {(diabetesResult !== '' || hypertensionResult !== '') && (
                            <View style={styles.resultsContainer}>
                                {hypertensionResult !== '' && (
                                    <Text style={styles.resultText}>{hypertensionResult}</Text>
                                )}
                                {diabetesResult !== '' && (
                                    <Text style={styles.resultText}>{diabetesResult}</Text>
                                )}
                            </View>
                        )}
                    </ScrollView>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#e0f7fa',
    },
    container: {
        flex: 1,
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#004d40',
        textAlign: 'center',
        marginBottom: 20,
    },
    formContainer: {
        backgroundColor: '#ffffffcc',
        borderRadius: 10,
        padding: 15,
    },
    sectionHeader: {
        backgroundColor: '#80deea',
        padding: 10,
        borderRadius: 5,
        marginTop: 15,
        marginBottom: 15,
    },
    sectionTitle: {
        fontWeight: 'bold',
        color: '#004d40',
        fontSize: 16,
    },
    formGroup: {
        marginBottom: 15,
    },
    label: {
        fontWeight: 'bold',
        marginBottom: 5,
    },
    input: {
        borderWidth: 1,
        borderColor: '#bbb',
        borderRadius: 5,
        padding: 8,
        fontSize: 14,
    },
    readonlyInput: {
        backgroundColor: '#f5f5f5',
    },
    picker: {
        borderWidth: 1,
        borderColor: '#bbb',
        borderRadius: 5,
    },
    radioGroup: {
        flexDirection: 'row',
    },
    radioOption: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 20,
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        marginBottom: 10,
    },
    updateButton: {
        backgroundColor: '#00695c',
        padding: 15,
        borderRadius: 5,
        alignItems: 'center',
        flex: 2,
        marginLeft: 10,
        marginBottom: 30,
    },
    updateButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    cancelButton: {
        backgroundColor: '#e0e0e0',
        padding: 15,
        borderRadius: 5,
        alignItems: 'center',
        flex: 1,
        marginBottom: 30,
    },
    cancelButtonText: {
        color: '#424242',
        fontWeight: 'bold',
        fontSize: 16,
    },
    warningsContainer: {
        marginTop: 15,
        padding: 10,
        backgroundColor: '#ffe6e6',
        borderRadius: 5,
        marginBottom: 20,
    },
    warningText: {
        color: 'red',
        marginBottom: 5,
    },
    resultsContainer: {
        marginTop: 20,
        padding: 15,
        backgroundColor: '#e8f5e9',
        borderRadius: 5,
    },
    resultText: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
        color: '#004d40',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#004d40',
    }
});

export default EditHealthRisk;

