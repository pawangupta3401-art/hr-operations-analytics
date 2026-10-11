import csv
import json
import os

with open('data/hr_attrition_raw.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    employees = []
    for r in reader:
        row = {}
        for k, v in r.items():
            clean_k = k.lstrip('\ufeff').strip()
            row[clean_k] = v.strip()

        age = int(row['Age'])
        if age < 25:
            age_band = '<25'
        elif age <= 34:
            age_band = '25-34'
        elif age <= 44:
            age_band = '35-44'
        elif age <= 54:
            age_band = '45-54'
        else:
            age_band = '55+'

        years_at_co = int(row['YearsAtCompany'])
        attrition_flag = 1 if row['Attrition'].strip() == 'Yes' else 0

        clean_emp = {
            'id': int(row.get('EmployeeNumber', len(employees) + 1)),
            'age': age,
            'ageBand': age_band,
            'attrition': row['Attrition'].strip(),
            'attritionFlag': attrition_flag,
            'department': row['Department'].strip(),
            'jobRole': row['JobRole'].strip(),
            'gender': row['Gender'].strip(),
            'maritalStatus': row['MaritalStatus'].strip(),
            'monthlyIncome': int(row['MonthlyIncome']),
            'overTime': row['OverTime'].strip(),
            'businessTravel': row['BusinessTravel'].strip(),
            'yearsAtCompany': years_at_co,
            'totalWorkingYears': int(row['TotalWorkingYears']),
            'yearsInCurrentRole': int(row['YearsInCurrentRole']),
            'yearsSinceLastPromotion': int(row['YearsSinceLastPromotion']),
            'yearsWithCurrManager': int(row['YearsWithCurrManager']),
            'jobSatisfaction': int(row['JobSatisfaction']),
            'envSatisfaction': int(row['EnvironmentSatisfaction']),
            'workLifeBalance': int(row['WorkLifeBalance']),
            'jobInvolvement': int(row['JobInvolvement']),
            'stockOptionLevel': int(row['StockOptionLevel']),
            'distanceFromHome': int(row['DistanceFromHome']),
            'educationField': row['EducationField'].strip()
        }
        employees.append(clean_emp)

os.makedirs('src', exist_ok=True)

# Generate src/data.js
js_content = f"// Auto-generated HR Attrition Dataset (1,470 Records)\nexport const EMPLOYEES = {json.dumps(employees, indent=None)};\n"
with open('src/data.js', 'w', encoding='utf-8') as f:
    f.write(js_content)

print(f"Extracted {len(employees)} employees successfully to src/data.js")
