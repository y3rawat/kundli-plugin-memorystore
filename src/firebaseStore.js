import 'dotenv/config';
import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

/**
 * Production Firebase Admin SDK Storage Adapter for MemoryStore Astrology Plugin
 */

class FirebaseStore {
    constructor() {
        this.isInitialized = false;
        this.db = null;
        this.localStorePath = path.resolve(process.env.TMPDIR || '/tmp', '.local_astrology_store.json');
        this.localData = { profiles: {}, analyses: {} };

        this.init();
    }

    init() {
        try {
            let credential = null;

            // 1. Try single JSON string from env
            if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
                const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();
                let parsed = null;
                if (raw.startsWith('{')) {
                    parsed = JSON.parse(raw);
                } else if (fs.existsSync(raw)) {
                    parsed = JSON.parse(fs.readFileSync(raw, 'utf8'));
                }
                if (parsed) credential = cert(parsed);
            }

            // 2. Try serviceAccountKey.json in current directory or root
            if (!credential) {
                const possibleKeyPaths = [
                    path.resolve(process.cwd(), 'serviceAccountKey.json'),
                    path.resolve(process.cwd(), 'serviceAccount.json'),
                    path.resolve(process.cwd(), 'firebase-service-account.json')
                ];

                for (const p of possibleKeyPaths) {
                    if (fs.existsSync(p)) {
                        try {
                            const parsed = JSON.parse(fs.readFileSync(p, 'utf8'));
                            if (parsed?.type === 'service_account' && parsed?.project_id) {
                                credential = cert(parsed);
                                console.log(`[FirebaseStore] Loaded credentials from file: ${path.basename(p)}`);
                                break;
                            }
                        } catch (err) {
                            console.warn(`[FirebaseStore] Could not parse ${p}:`, err.message);
                        }
                    }
                }
            }

            // 3. Try individual environment variables
            if (!credential) {
                const projectId = process.env.FIREBASE_PROJECT_ID || 'memorystore-kundli-plugin';
                const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
                let privateKey = process.env.FIREBASE_PRIVATE_KEY;

                if (clientEmail && privateKey) {
                    privateKey = privateKey.replace(/\\n/g, '\n');
                    credential = cert({
                        projectId,
                        clientEmail,
                        privateKey
                    });
                }
            }

            if (credential) {
                const app = getApps().length === 0 ? initializeApp({ credential }) : getApp();
                this.db = getFirestore(app);
                this.isInitialized = true;
                console.log('[FirebaseStore] Initialized Firebase Admin SDK (Production Mode).');
                return;
            }

            console.warn('[FirebaseStore] No Firebase Service Account Key found. Running in Local Storage Mode.');
            this.loadLocalData();
        } catch (err) {
            console.warn('[FirebaseStore] Initialization error, falling back to local store:', err.message);
            this.loadLocalData();
        }
    }

    loadLocalData() {
        try {
            if (fs.existsSync(this.localStorePath)) {
                const raw = fs.readFileSync(this.localStorePath, 'utf8');
                this.localData = JSON.parse(raw);
            }
        } catch {
            this.localData = { profiles: {}, analyses: {} };
        }
    }

    persistLocalData() {
        try {
            fs.writeFileSync(this.localStorePath, JSON.stringify(this.localData, null, 2), 'utf8');
        } catch (err) {
            console.error('[FirebaseStore] Failed to persist local store:', err.message);
        }
    }

    /**
     * Saves user's natal Kundli chart and profile details.
     */
    async saveUserProfile(profileId, profileData) {
        const record = {
            ...profileData,
            profile_id: profileId,
            updated_at: new Date().toISOString()
        };

        if (this.isInitialized && this.db) {
            try {
                await this.db.collection('astrology_user_profiles').doc(profileId).set(record, { merge: true });
                return record;
            } catch (err) {
                console.error('[FirebaseStore] Error writing to Firestore:', err.message);
            }
        }

        // Local fallback
        this.localData.profiles[profileId] = record;
        this.persistLocalData();
        return record;
    }

    /**
     * Fetches user's natal Kundli chart.
     */
    async getUserProfile(profileId) {
        if (!profileId) return null;

        if (this.isInitialized && this.db) {
            try {
                const docSnap = await this.db.collection('astrology_user_profiles').doc(profileId).get();
                if (docSnap.exists) {
                    return docSnap.data();
                }
            } catch (err) {
                console.error('[FirebaseStore] Error reading from Firestore:', err.message);
            }
        }

        // Local fallback
        return this.localData.profiles[profileId] || null;
    }

    /**
     * Saves AI video synthesis report.
     */
    async saveAnalysisResult(resultId, resultData) {
        const record = {
            ...resultData,
            result_id: resultId,
            created_at: new Date().toISOString()
        };

        if (this.isInitialized && this.db) {
            try {
                await this.db.collection('astrology_video_analyses').doc(resultId).set(record, { merge: true });
                return record;
            } catch (err) {
                console.error('[FirebaseStore] Error saving analysis result to Firestore:', err.message);
            }
        }

        // Local fallback
        this.localData.analyses[resultId] = record;
        this.persistLocalData();
        return record;
    }

    /**
     * Fetches AI video synthesis report.
     */
    async getAnalysisResult(resultId) {
        if (!resultId) return null;

        if (this.isInitialized && this.db) {
            try {
                const docSnap = await this.db.collection('astrology_video_analyses').doc(resultId).get();
                if (docSnap.exists) {
                    return docSnap.data();
                }
            } catch (err) {
                console.error('[FirebaseStore] Error fetching analysis result from Firestore:', err.message);
            }
        }

        // Local fallback
        return this.localData.analyses[resultId] || null;
    }
}

export const firebaseStore = new FirebaseStore();
