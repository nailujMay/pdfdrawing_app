import pandas as pd
import numpy as np  
import openpyxl as pxl
import re

class Part:
    def __init__(self, material, weight):
        self.material = material
        self.weight = weight
    
    def update_weight(self,new_weight):
        self.weight = new_weight


def clean_data(data_str):
    if isinstance(data_str, str):
        data_str = re.sub(r'\s*kg', '', data_str, flags=re.IGNORECASE).strip()
        try:
            return float(data_str)
        except ValueError:
            return np.nan  # Convert non-numeric values to NaN
    else:
        return data_str  # Return unchanged for non-string values

def clean_df(df):
    df['Weight'] = df['Weight'].apply(clean_data)
    df['Quantity'] = df['Quantity'].apply(clean_data)
    df = df[~df['File Name'].str.contains('file_name')]
    return df


def materialSum (df):
    parts = []
    material_dict = {}
    material_list = []
    weight_list = []
    for index, row in df.iterrows():
        material_check = row['Material']
        weight = float(row['Weight'])
        quantity = float(row['Quantity'])
        total_weight = weight * quantity

        # Check if the material exists in the dictionary
        if material_check not in material_dict:
            # If it does not exist, create a new Part object and add it to the dictionary
            new_part = Part(material_check, (weight * quantity))
            material_dict[material_check] = new_part
            parts.append(new_part)
        else:
            # If it exists, update the weight of the existing Part object
            # print(material_dict[material_check].weight)
            material_dict[material_check].weight += (weight * quantity)
        
        # print(material_dict)
   
    for part in parts:
        material_list.append(part.material)
        weight_list.append(part.weight)

    # Create a dictionary to hold the collected data
    data_dict = {
        'material': material_list,
        'weight': weight_list
    }

    sum_df = pd.DataFrame(data_dict)
    print(sum_df)
    
    return sum_df



