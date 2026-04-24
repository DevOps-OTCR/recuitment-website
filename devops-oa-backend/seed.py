import pandas as pd
import json
from database import SessionLocal
from models import Application, Cycle, DecisionStatus

def seed_applications(xlsx_path: str, sheet: str, cycle_name: str, semester_name: str, decision: DecisionStatus):
    """Reads a specific tab from an Excel file and seeds it into the database."""
    db = SessionLocal()
    
    try:
        # 1. Find or create the Cycle
        cycle = db.query(Cycle).filter_by(name=cycle_name, semester=semester_name).first()
        if not cycle:
            cycle = Cycle(name=cycle_name, semester=semester_name)
            db.add(cycle)
            db.commit()
            db.refresh(cycle)
            print(f"Created new cycle: {semester_name} {cycle_name}")

        # 2. Read the specific tab from the Excel file
        print(f"Reading tab '{sheet}' from {xlsx_path}...")
        df = pd.read_excel(xlsx_path, sheet_name=sheet).fillna('')


        print(f"COLUMNS: {df.columns.tolist()}")
        # 3. Iterate through rows
        apps_to_insert = []
        for index, row in df.iterrows():
            # Grab the Full Name
            full_name = str(row.get('Full Name', '')).strip()
            
            # If there's no name, skip the row
            if not full_name or full_name.lower() == 'nan':
                continue

            # Split "First Last" into two variables safely
            name_parts = full_name.split(' ', 1)
            first_name = name_parts[0]
            last_name = name_parts[1] if len(name_parts) > 1 else ''

            app = Application(
                cycle_id=cycle.id,
                final_decision=decision,
                name=full_name,
                first_name=first_name,
                last_name=last_name,
                email=str(row.get('Email', f"missing_email_{index}@example.com")).strip(),
                major=str(row.get('Major 1', '')),               # Updated to match sheet
                gpa=str(row.get('Cumulative GPA', '')),          # Updated to match sheet
                grad_year=str(row.get('Year', '')),              # Updated to match sheet
                application_data=row.to_dict()
            )
            apps_to_insert.append(app)
    
            
        # 4. Insert
        if apps_to_insert:
            db.add_all(apps_to_insert)
            db.commit()
            print(f"✅ Successfully inserted {len(apps_to_insert)} applications into {semester_name} {cycle_name} as {decision.value}.")
        else:
            print(f"⚠️ No valid rows found in tab '{sheet}'.")

    except FileNotFoundError:
        print(f"❌ Could not find file: {xlsx_path}. Make sure it is in the same folder as this script!")
    except Exception as e:
        print(f"❌ Error occurred: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    # The name of the single Excel file sitting in your folder
    EXCEL_FILE = "2_Applications_Cycle1_2_SAMPLE.xlsx"
    
    # 1. Seed the "Yes" tab
    seed_applications(
        xlsx_path=EXCEL_FILE, 
        sheet="Yes",  # The exact name of the tab at the bottom of the Excel file
        cycle_name="Cycle 1", 
        semester_name="SP26", 
        decision=DecisionStatus.YES
    )
    
    # 2. Seed the "No" tab
    seed_applications(
        xlsx_path=EXCEL_FILE, 
        sheet="No", 
        cycle_name="Cycle 1", 
        semester_name="SP26", 
        decision=DecisionStatus.NO
    )