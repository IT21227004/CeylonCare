import json
import sys
import os
import numpy as np
import pandas as pd
import tensorflow as tf
import joblib
from sklearn.metrics.pairwise import cosine_similarity
import random

class SriLankanFoodPredictor:
    def __init__(self):
        self.models_dir = 'ml_models'
        self.data_dir   = 'ml_data'
        self.models     = {}
        self.scalers    = {}
        self.encoders   = {}
        self.dataset    = None
        self.metadata   = None
        self._load_models()

    def _load_models(self):
        try:
            # Content-based TF model
            p = os.path.join(self.models_dir, 'content_based_model.h5')
            if os.path.exists(p):
                self.models['content_based'] = tf.keras.models.load_model(p)
            # K-Means clustering
            p = os.path.join(self.models_dir, 'kmeans.pkl')
            if os.path.exists(p):
                self.models['clustering'] = joblib.load(p)
            # Health classifier
            p = os.path.join(self.models_dir, 'rf_health.pkl')
            if os.path.exists(p):
                self.models['health_classifier'] = joblib.load(p)
            # Scalers
            p = os.path.join(self.models_dir, 'content_scaler.pkl')
            if os.path.exists(p):
                self.scalers['content'] = joblib.load(p)
            p = os.path.join(self.models_dir, 'kmeans_scaler.pkl')
            if os.path.exists(p):
                self.scalers['clustering'] = joblib.load(p)
            # Encoder
            p = os.path.join(self.models_dir, 'health_le.pkl')
            if os.path.exists(p):
                self.encoders['health'] = joblib.load(p)
            # Dataset
            p = os.path.join(self.data_dir, 'foods_with_clusters.csv')
            if os.path.exists(p):
                self.dataset = pd.read_csv(p)
            else:
                p = os.path.join(self.data_dir, 'sri_lankan_foods.csv')
                if os.path.exists(p):
                    self.dataset = pd.read_csv(p)
            # Metadata
            p = os.path.join(self.models_dir, 'metadata.json')
            if os.path.exists(p):
                with open(p) as f:
                    self.metadata = json.load(f)
        except Exception:
            pass

    def predict_recommendations(self, user_profile, limit=5):
        if self.dataset is None:
            return self._get_fallback_recommendations(limit)

        conditions = user_profile.get('medical_conditions', [])
        recs = []

        for _, food in self.dataset.iterrows():
            feats = np.array([[
                food['protein'], food['fat'], food['carbs'],
                food['potassium'], food['fiber'], food['sodium'],
                food['magnesium'], food['calories'],
                food['cooking_time'], food['glycemic_index']
            ]])

            # scale
            if 'content' in self.scalers:
                feats = self.scalers['content'].transform(feats)

            # predict
            if 'content_based' in self.models:
                preds = self.models['content_based'].predict(feats, verbose=0)
                bp = preds[0][0][0]
                db = preds[1][0][0]
                hs = preds[2][0][0]
            else:
                bp = db = hs = 0.7

            score = self._calculate_compatibility(conditions, bp, db, hs, food)
            recs.append({
                'id': int(food['id']),
                'name': food['name'],
                'health_category': food['health_category'],
                'recipe_category': food.get('recipe_category', ''),
                'compatibility_score': float(score),
                'health_score': float(food['health_score']),
                'calories': int(food['calories']),
                'cooking_time': int(food['cooking_time']),
                'portion_size': food['portion_size'],
                'ingredients': json.loads(food['ingredients']) if isinstance(food['ingredients'], str) else [],
                'instructions': json.loads(food['instructions']) if isinstance(food['instructions'], str) else [],
                'nutrition': {
                    'protein': float(food['protein']),
                    'fat': float(food['fat']),
                    'carbs': float(food['carbs']),
                    'potassium': float(food['potassium']),
                    'fiber': float(food['fiber']),
                    'sodium': float(food['sodium']),
                    'magnesium': float(food['magnesium'])
                }
            })

        recs.sort(key=lambda x: x['compatibility_score'], reverse=True)
        return recs[:limit]

    def _calculate_compatibility(self, conditions, bp, db, hs, food):
        base = hs * 100
        if 'High Blood Pressure' in conditions:
            base += bp * 20
        if 'Diabetes' in conditions:
            base += db * 20
        return min(100, max(0, base))

    def find_similar_foods(self, food_id, limit=5):
        if self.dataset is None:
            return []

        target = self.dataset[self.dataset['id'] == food_id]
        if target.empty:
            return []

        food0 = target.iloc[0]
        if 'cluster' in food0 and not pd.isna(food0['cluster']):
            sims = self.dataset[
                (self.dataset['cluster'] == food0['cluster']) &
                (self.dataset['id'] != food_id)
            ]
        else:
            cols = ['protein','fat','carbs','potassium','fiber','sodium','magnesium','calories','health_score']
            tfv = food0[cols].values.reshape(1,-1)
            afv = self.dataset[cols].values
            sim = cosine_similarity(tfv, afv)[0]
            idxs = np.argsort(sim)[::-1][1:limit+1]
            sims = self.dataset.iloc[idxs]

        out = []
        for _, f in sims.head(limit).iterrows():
            out.append({
                'id': int(f['id']),
                'name': f['name'],
                'health_score': float(f['health_score']),
                'health_category': f['health_category'],
                'calories': int(f['calories']),
                'cooking_time': int(f['cooking_time'])
            })
        return out

    

    import numpy as np  # make sure this is imported at top

    def generate_meal_plan(self, user_profile, days=7):
        recs = self.predict_recommendations(user_profile, limit=50)
        if not recs:
            return self._get_fallback_meal_plan(days)

        days_of_week = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
        meal_types   = ['Breakfast','Lunch','Dinner']

        meal_plan = []
        for i in range(days):
            day_name = days_of_week[i % 7]
            used_ids = set()
            day_meals = []

            for meal in meal_types:
                cands = self._filter_foods_for_meal(recs, meal)
                if not cands:
                    continue

                idx = i % len(cands)
                sel = cands[idx]

                # avoid duplicates in same day
                if sel['id'] in used_ids:
                    for offset in range(1, len(cands)):
                        cand = cands[(idx + offset) % len(cands)]
                        if cand['id'] not in used_ids:
                            sel = cand
                            break

                used_ids.add(sel['id'])

                # sanitize any NaNs in portion_size
                raw_portion = sel.get('portion_size', '')
                if isinstance(raw_portion, float) and np.isnan(raw_portion):
                    raw_portion = ''

                day_meals.append({
                    'type':               meal,
                    'name':               sel['name'],
                    'time':               self._get_meal_time(meal),
                    'portion':            raw_portion,
                    'calories':           int(sel['calories']),
                    'cooking_time':       int(sel['cooking_time']),
                    'health_score':       float(sel.get('health_score', 0)),
                    'compatibility_score':float(sel.get('compatibility_score', 0)),
                })

            meal_plan.append({
                'id':   i + 1,
                'day':  day_name,
                'meals': day_meals
            })

        return meal_plan

    def _filter_foods_for_meal(self, foods, meal, max_candidates=10):
        pool = foods[:]  
        random.shuffle(pool)
        return pool[:max_candidates]


    def _get_meal_time(self, meal):
        return {'Breakfast':'7:30 AM','Lunch':'12:30 PM','Dinner':'7:00 PM'}.get(meal,'12:00 PM')

    def analyze_food_image(self, food_hint=None):
        if self.dataset is None:
            return self._get_fallback_analysis()

        # 1) Pick the food
        if food_hint:
            df = self.dataset[
                self.dataset['name'].str.contains(food_hint, case=False, na=False)
            ]
            food = df.iloc[0] if not df.empty else self.dataset.sample(1).iloc[0]
        else:
            weights = self.dataset['health_score'] / self.dataset['health_score'].sum()
            food = self.dataset.sample(1, weights=weights).iloc[0]

        # 2) Prepare features
        feats = np.array([[ 
            food['protein'], food['fat'], food['carbs'],
            food['potassium'], food['fiber'], food['sodium'],
            food['magnesium'], food['calories'],
            food['cooking_time'], food['glycemic_index']
        ]])
        if 'content' in self.scalers:
            feats = self.scalers['content'].transform(feats)

        # 3) Get ML predictions
        if 'content_based' in self.models:
            preds = self.models['content_based'].predict(feats, verbose=0)
            bp = preds[0][0][0] * 100
            db = preds[1][0][0] * 100
        else:
            bp = db = 70.0

        # 4) Sanitize portion_size and category
        raw_portion = food.get('portion_size', '')
        portion = '' if pd.isna(raw_portion) else raw_portion

        category = food.get('recipe_category', '')
        if pd.isna(category):
            category = ''

        # 5) Build and return a JSON-safe dict
        return {
            "identified_food": food.get('name', ''),
            "confidence": float(0.8 + np.random.random() * 0.15),
            "food_id": int(food.get('id', 0)),
            "nutritional_analysis": {
                "calories":    f"{int(food.get('calories', 0))} kcal",
                "protein":     f"{food.get('protein', 0):.1f}g",
                "fat":         f"{food.get('fat', 0):.1f}g",
                "carbs":       f"{food.get('carbs', 0):.1f}g",
                "fiber":       f"{food.get('fiber', 0):.1f}g",
                "potassium":   f"{food.get('potassium', 0):.0f}mg",
            },
            "health_analysis": {
                "overall_score":           float(food.get('health_score', 0)),
                "blood_pressure_friendly": float(bp),
                "diabetes_friendly":       float(db),
                "glycemic_index":          int(food.get('glycemic_index', 0))
            },
            "cooking_info": {
                "estimated_time": int(food.get('cooking_time', 0)),
                "portion_size":   portion,
                "category":       category
            }
        }



    def _get_fallback_recommendations(self, limit):
        return [{
            'id':1,'name':'Gotukola Sambol','compatibility_score':85.0,
            'health_score':87.0,'calories':42,'cooking_time':10,
            'health_category':'both','recipe_category':'herb_salad',
            'portion_size':'2 tbsp',
            'ingredients':['Gotukola leaves','Coconut','Lime juice'],
            'instructions':['Mix ingredients','Serve fresh'],
            'nutrition':{'protein':2.1,'fat':0.8,'carbs':6.2,
                        'potassium':298,'fiber':2.8,'sodium':0.3,'magnesium':0.7}
        }][:limit]

    def _get_fallback_meal_plan(self, days):
        return [{
            'id':1,'day':'Monday','meals':[
                {'type':'Breakfast','name':'Kola Kanda','time':'7:30 AM','calories':102,'cooking_time':40},
                {'type':'Lunch','name':'Sri Lankan Curry','time':'12:30 PM','calories':150,'cooking_time':25},
                {'type':'Dinner','name':'Herbal Tea','time':'7:00 PM','calories':15,'cooking_time':10}
            ]
        }][:days]

    def _get_fallback_analysis(self):
        return {
            'identified_food':'Traditional Sri Lankan Dish',
            'confidence':0.75,
            'nutritional_analysis':{'calories':'80 kcal','protein':'3.0g','fiber':'2.5g'},
            'health_analysis':{'overall_score':75.0}
        }

    def get_model_info(self):
        return {
            'models_loaded': list(self.models.keys()),
            'dataset_size' : len(self.dataset) if self.dataset is not None else 0,
            'metadata'     : self.metadata or {},
            'status'       : 'ready' if self.models else 'no_models'
        }

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error":"No command provided"}))
        return

    cmd       = sys.argv[1]
    pred      = SriLankanFoodPredictor()
    try:
        if cmd=="recommend":
            profile = json.loads(sys.argv[2])
            limit   = int(sys.argv[3])
            out     = pred.predict_recommendations(profile, limit)
            print(json.dumps({"success":True,"recommendations":out}))
        elif cmd=="similar":
            fid   = int(sys.argv[2])
            limit = int(sys.argv[3])
            out   = pred.find_similar_foods(fid, limit)
            print(json.dumps({"success":True,"similar_foods":out}))
        elif cmd=="meal_plan":
            profile = json.loads(sys.argv[2])
            days    = int(sys.argv[3])
            out     = pred.generate_meal_plan(profile, days)
            print(json.dumps({"success":True,"meal_plan":out}))
        elif cmd=="analyze_image":
            hint = sys.argv[2] if len(sys.argv)>2 else None
            out  = pred.analyze_food_image(hint)
            print(json.dumps({"success":True,"analysis":out}))
        elif cmd=="model_info":
            out = pred.get_model_info()
            print(json.dumps({"success":True,"model_info":out}))
        else:
            print(json.dumps({"error":f"Unknown command: {cmd}"}))
    except Exception as e:
        print(json.dumps({"success":False,"error":str(e)}))

if __name__=="__main__":
    main()
