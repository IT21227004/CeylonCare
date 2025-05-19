import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, FlatList,
    SafeAreaView, StatusBar, Alert, ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

interface HealthRiskData {
    id: string;
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
    createdAt: string;
    diabetes_risk: string;
    hypertension_risk: string;
}

const ViewHealthRisk = ({ navigation }: any) => {
    const [healthRisks, setHealthRisks] = useState<HealthRiskData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [selectedRisk, setSelectedRisk] = useState<string | null>(null);

    useEffect(() => {
        fetchHealthRisks();
    }, []);

    const fetchHealthRisks = async () => {
        setLoading(true);
        try {
            const userId = await AsyncStorage.getItem("userId");
            if (!userId) {
                Alert.alert("Error", "User ID not found. Please log in again.");
                setLoading(false);
                return;
            }

            const userName = await AsyncStorage.getItem("userName");

            const response = await fetch(`http://192.168.60.22:5000/riskassessment/user/${userId}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();

            if (response.ok) {
                const updatedData = data.map((item: HealthRiskData) => {
                    if (!item.username && userName) {
                        return { ...item, username: userName };
                    }
                    return item;
                });

                setHealthRisks(updatedData || []);
            } else {
                throw new Error(data.error || "Failed to fetch health risk assessments");
            }
        } catch (error: any) {
            console.error("Error fetching health risks:", error.message);
            Alert.alert("Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteRisk = async (riskId: string) => {
        Alert.alert(
            "Confirm Deletion",
            "Are you sure you want to delete this health risk assessment?",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const response = await fetch(`http://192.168.60.22:5000/riskassessment/${riskId}`, {
                                method: "DELETE",
                                headers: {
                                    "Content-Type": "application/json",
                                },
                            });

                            const data = await response.json();

                            if (response.ok) {
                                // Remove the deleted risk from the state
                                setHealthRisks(prevRisks => prevRisks.filter(risk => risk.id !== riskId));
                                Alert.alert("Success", "Health risk assessment deleted successfully");
                            } else {
                                throw new Error(data.error || "Failed to delete health risk assessment");
                            }
                        } catch (error: any) {
                            console.error("Error deleting health risk:", error.message);
                            Alert.alert("Error", error.message);
                        }
                    }
                }
            ]
        );
    };

    const handleEditRisk = (risk: HealthRiskData) => {
        navigation.navigate("EditHealthRisk", { riskData: risk });
    };

    const toggleRiskSelection = (riskId: string) => {
        setSelectedRisk(prevSelected => prevSelected === riskId ? null : riskId);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const renderRiskItem = ({ item }: { item: HealthRiskData }) => {
        const isSelected = selectedRisk === item.id;

        return (
            <TouchableOpacity
                style={[styles.riskItem, isSelected && styles.selectedRiskItem]}
                onPress={() => toggleRiskSelection(item.id)}
            >
                <View style={styles.riskHeader}>
                    <Text style={styles.riskDate}>{formatDate(item.createdAt)}</Text>
                    {item.username && <Text style={styles.username}>{item.username}</Text>}
                </View>

                <View style={styles.riskContent}>
                    <View style={styles.riskDetails}>
                        <View style={styles.detailRow}>
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>Age:</Text>
                                <Text style={styles.detailValue}>{item.age} years</Text>
                            </View>
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>BMI:</Text>
                                <Text style={styles.detailValue}>{item.bmi}</Text>
                            </View>
                        </View>
                        <View style={styles.detailRow}>
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>Gender:</Text>
                                <Text style={styles.detailValue}>{item.gender}</Text>
                            </View>
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>Smoking:</Text>
                                <Text style={styles.detailValue}>{item.smokingStatus}</Text>
                            </View>
                        </View>
                        <View style={styles.detailRow}>
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>Diabetes:</Text>
                                <Text style={styles.detailValue}>{item.diabetes === "1" ? "Yes" : "No"}</Text>
                            </View>
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>Hypertension:</Text>
                                <Text style={styles.detailValue}>{item.hypertension === "1" ? "Yes" : "No"}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.riskBadgesContainer}>
                        <Text style={styles.riskBadgesTitle}>Risk Assessment:</Text>
                        <View style={styles.riskBadges}>
                            <View style={[
                                styles.riskBadge,
                                item.diabetes === "1" ? styles.highRiskBadge :
                                    item.diabetes_risk === "high" ? styles.highRiskBadge :
                                        item.diabetes_risk === "medium" ? styles.mediumRiskBadge :
                                            item.diabetes_risk === "low" ? styles.lowRiskBadge : styles.noRiskBadge
                            ]}>
                                <Text style={styles.riskBadgeLabel}>Diabetes</Text>
                                <Text style={styles.riskBadgeText}>
                                    {item.diabetes === "1" ? "Has Diabetes" :
                                        !item.diabetes_risk || item.diabetes_risk === "0" ? "No Risk" :
                                            `${(item.diabetes_risk || "").charAt(0).toUpperCase() + (item.diabetes_risk || "").slice(1)} Risk`}
                                </Text>
                            </View>

                            <View style={[
                                styles.riskBadge,
                                item.hypertension === "1" ? styles.highRiskBadge :
                                    item.hypertension_risk === "high" ? styles.highRiskBadge :
                                        item.hypertension_risk === "medium" ? styles.mediumRiskBadge :
                                            item.hypertension_risk === "low" ? styles.lowRiskBadge : styles.noRiskBadge
                            ]}>
                                <Text style={styles.riskBadgeLabel}>Hypertension</Text>
                                <Text style={styles.riskBadgeText}>
                                    {item.hypertension === "1" ? "Has Hypertension" :
                                        !item.hypertension_risk || item.hypertension_risk === "0" ? "No Risk" :
                                            `${(item.hypertension_risk || "").charAt(0).toUpperCase() + (item.hypertension_risk || "").slice(1)} Risk`}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {isSelected && (
                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.editButton]}
                            onPress={() => handleEditRisk(item)}
                        >
                            <Ionicons name="pencil" size={18} color="#fff" />
                            <Text style={styles.actionButtonText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.deleteButton]}
                            onPress={() => handleDeleteRisk(item.id)}
                        >
                            <Ionicons name="trash" size={18} color="#fff" />
                            <Text style={styles.actionButtonText}>Delete</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </TouchableOpacity>
        );
    };


    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Your Health Risk Assessments</Text>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => navigation.navigate("AddHealthRisk")}
                    >
                        <Ionicons name="add-circle" size={24} color="#004d40" />
                        <Text style={styles.addButtonText}>New Assessment</Text>
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#004d40" />
                        <Text style={styles.loadingText}>Loading your health risk assessments...</Text>
                    </View>
                ) : healthRisks.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="document-text-outline" size={64} color="#80deea" />
                        <Text style={styles.emptyText}>No health risk assessments found</Text>
                        <Text style={styles.emptySubText}>
                            Complete a health risk assessment to see your results here
                        </Text>
                        <TouchableOpacity
                            style={styles.startButton}
                            onPress={() => navigation.navigate("AddHealthRisk")}
                        >
                            <Text style={styles.startButtonText}>Start Assessment</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={healthRisks}
                        renderItem={renderRiskItem}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContainer}
                        showsVerticalScrollIndicator={false}
                    />
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
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#004d40',
        flex: 1,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#80deea',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    addButtonText: {
        marginLeft: 4,
        color: '#004d40',
        fontWeight: 'bold',
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
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#004d40',
        marginTop: 16,
    },
    emptySubText: {
        fontSize: 14,
        color: '#00695c',
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 24,
    },
    startButton: {
        backgroundColor: '#00695c',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 25,
    },
    startButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    listContainer: {
        paddingBottom: 20,
    },
    riskItem: {
        backgroundColor: '#ffffff',
        borderRadius: 10,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
    },
    selectedRiskItem: {
        borderWidth: 2,
        borderColor: '#00695c',
    },
    riskDetails: {
        marginBottom: 12,
    },
    riskHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    riskDate: {
        fontSize: 14,
        color: '#555',
    },
    riskContent: {
        marginTop: 8,
        marginBottom: 8,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    detailItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#00695c',
        marginRight: 4,
    },
    detailValue: {
        fontSize: 14,
        color: '#333',
    },
    riskBadgesContainer: {
        marginTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        paddingTop: 10,
    },
    riskBadgesTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#00695c',
        marginBottom: 8,
    },
    riskBadges: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    riskBadge: {
        flex: 1,
        borderRadius: 8,
        padding: 8,
        marginHorizontal: 4,
        alignItems: 'center',
    },
    riskBadgeLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 2,
    },
    riskBadgeText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    highRiskBadge: {
        backgroundColor: '#ffcdd2',
    },
    mediumRiskBadge: {
        backgroundColor: '#fff9c4',
    },
    lowRiskBadge: {
        backgroundColor: '#c8e6c9',
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 5,
        marginLeft: 8,
    },
    editButton: {
        backgroundColor: '#4caf50',
    },
    deleteButton: {
        backgroundColor: '#f44336',
    },
    actionButtonText: {
        color: '#fff',
        marginLeft: 4,
        fontWeight: 'bold',
    },
    username: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#004d40',
    },

    noRiskBadge: {
        backgroundColor: '#e0e0e0',
    },
});

export default ViewHealthRisk;
