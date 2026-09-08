"""
Bangladesh Administrative Location Hierarchy
8 Divisions → 64 Districts → ~500 Upazilas → Unions → Local Areas
"""

BANGLADESH_LOCATIONS = {
    "Dhaka": {
        "districts": {
            "Dhaka": ["Dhamrai", "Dohar", "Keraniganj", "Nawabganj", "Savar"],
            "Faridpur": ["Alfadanga", "Bhanga", "Boalmari", "Charbhadrasan", "Faridpur Sadar"],
            "Gazipur": ["Gazipur Sadar", "Kaliakair", "Kaliganj", "Kapasia", "Sreepur"],
            "Gopalganj": ["Gopalganj Sadar", "Kashiani", "Kotalipara", "Muksudpur", "Tungipara"],
            "Jamalpur": ["Bakshiganj", "Dewanganj", "Islampur", "Jamalpur Sadar", "Madarganj"],
            "Kishoreganj": ["Austagram", "Bajitpur", "Bhairab", "Hossainpur", "Itna"],
            "Madaripur": ["Kalkini", "Madaripur Sadar", "Rajoir", "Shibchar"],
            "Manikganj": ["Daulatpur", "Ghior", "Harirampur", "Manikganj Sadar", "Saturia"],
            "Munshiganj": ["Gazaria", "Lohajang", "Munshiganj Sadar", "Serajdikhan", "Sreenagar"],
            "Mymensingh": ["Bhaluka", "Dhobaura", "Fulbaria", "Gaffargaon", "Mymensingh Sadar"],
            "Narayanganj": ["Araihazar", "Bandar", "Narayanganj Sadar", "Rupganj", "Sonargaon"],
            "Narsingdi": ["Belabo", "Monohardi", "Narsingdi Sadar", "Palash", "Raipura"],
            "Netrokona": ["Atpara", "Barhatta", "Durgapur", "Khaliajuri", "Netrokona Sadar"],
            "Rajbari": ["Baliakandi", "Goalandaghat", "Pangsha", "Rajbari Sadar"],
            "Shariatpur": ["Bhedarganj", "Damudya", "Gosairhat", "Naria", "Shariatpur Sadar"],
            "Sherpur": ["Jhenaigati", "Nakla", "Nalitabari", "Sherpur Sadar", "Sreebardi"],
            "Tangail": ["Basail", "Bhuapur", "Delduar", "Ghatail", "Tangail Sadar"]
        }
    },
    "Chittagong": {
        "districts": {
            "Bandarban": ["Alikadam", "Bandarban Sadar", "Lama", "Naikhongchhari", "Rowangchhari"],
            "Brahmanbaria": ["Akhaura", "Bancharampur", "Brahmanbaria Sadar", "Kasba", "Nabinagar"],
            "Chandpur": ["Chandpur Sadar", "Faridganj", "Haimchar", "Hajiganj", "Kachua"],
            "Chittagong": ["Anwara", "Banshkhali", "Boalkhali", "Chandanaish", "Chittagong Port"],
            "Comilla": ["Barura", "Brahmanpara", "Burichang", "Comilla Sadar", "Daudkandi"],
            "Cox's Bazar": ["Chakaria", "Cox's Bazar Sadar", "Kutubdia", "Maheshkhali", "Ramu"],
            "Feni": ["Chhagalnaiya", "Daganbhuiyan", "Feni Sadar", "Parshuram", "Sonagazi"],
            "Khagrachhari": ["Dighinala", "Khagrachhari Sadar", "Lakshmichhari", "Mahalchhari", "Manikchhari"],
            "Lakshmipur": ["Lakshmipur Sadar", "Raipur", "Ramganj", "Ramgati"],
            "Noakhali": ["Begumganj", "Chatkhil", "Companiganj", "Hatiya", "Noakhali Sadar"],
            "Rangamati": ["Baghaichhari", "Barkal", "Kawkhali", "Langadu", "Rangamati Sadar"]
        }
    },
    "Rajshahi": {
        "districts": {
            "Bogra": ["Adamdighi", "Bogra Sadar", "Dhunat", "Gabtali", "Kahaloo"],
            "Joypurhat": ["Akkelpur", "Joypurhat Sadar", "Kalai", "Khetlal", "Panchbibi"],
            "Naogaon": ["Atrai", "Badalgachhi", "Dhamoirhat", "Manda", "Naogaon Sadar"],
            "Natore": ["Bagatipara", "Baraigram", "Gurudaspur", "Lalpur", "Natore Sadar"],
            "Nawabganj": ["Bholahat", "Gomastapur", "Nachole", "Nawabganj Sadar", "Shibganj"],
            "Pabna": ["Atgharia", "Bera", "Bhangura", "Chatmohar", "Pabna Sadar"],
            "Rajshahi": ["Bagha", "Bagmara", "Charghat", "Durgapur", "Rajshahi Sadar"],
            "Sirajganj": ["Belkuchi", "Chauhali", "Kamarkhanda", "Raiganj", "Sirajganj Sadar"]
        }
    },
    "Khulna": {
        "districts": {
            "Bagerhat": ["Bagerhat Sadar", "Chitalmari", "Fakirhat", "Kachua", "Mollahat"],
            "Chuadanga": ["Alamdanga", "Chuadanga Sadar", "Damurhuda", "Jibannagar"],
            "Jessore": ["Abhaynagar", "Bagherpara", "Chaugachha", "Jessore Sadar", "Jhikargachha"],
            "Jhenaidah": ["Harinakunda", "Jhenaidah Sadar", "Kaliganj", "Kotchandpur", "Maheshpur"],
            "Khulna": ["Batiaghata", "Dacope", "Dumuria", "Dighalia", "Khulna Sadar"],
            "Kushtia": ["Bheramara", "Daulatpur", "Khoksa", "Kumarkhali", "Kushtia Sadar"],
            "Magura": ["Magura Sadar", "Mohammadpur", "Shalikha", "Sreepur"],
            "Meherpur": ["Gangni", "Meherpur Sadar", "Mujibnagar"],
            "Narail": ["Kalia", "Lohagara", "Narail Sadar"],
            "Satkhira": ["Assasuni", "Debhata", "Kalaroa", "Kaliganj", "Satkhira Sadar"]
        }
    },
    "Barisal": {
        "districts": {
            "Barguna": ["Amtali", "Bamna", "Barguna Sadar", "Betagi", "Patharghata"],
            "Barisal": ["Agailjhara", "Babuganj", "Bakerganj", "Banaripara", "Barisal Sadar"],
            "Bhola": ["Bhola Sadar", "Burhanuddin", "Char Fasson", "Daulatkhan", "Lalmohan"],
            "Jhalokati": ["Jhalokati Sadar", "Kathalia", "Nalchity", "Rajapur"],
            "Patuakhali": ["Bauphal", "Dashmina", "Dumki", "Galachipa", "Patuakhali Sadar"],
            "Pirojpur": ["Bhandaria", "Kawkhali", "Mathbaria", "Nazirpur", "Pirojpur Sadar"]
        }
    },
    "Sylhet": {
        "districts": {
            "Habiganj": ["Ajmiriganj", "Bahubal", "Baniyachong", "Chunarughat", "Habiganj Sadar"],
            "Moulvibazar": ["Barlekha", "Juri", "Kamalganj", "Kulaura", "Moulvibazar Sadar"],
            "Sunamganj": ["Bishwambarpur", "Chhatak", "Derai", "Dharamapasha", "Sunamganj Sadar"],
            "Sylhet": ["Balaganj", "Beanibazar", "Bishwanath", "Companiganj", "Sylhet Sadar"]
        }
    },
    "Rangpur": {
        "districts": {
            "Dinajpur": ["Birampur", "Birganj", "Biral", "Bochaganj", "Dinajpur Sadar"],
            "Gaibandha": ["Gaibandha Sadar", "Gobindaganj", "Palashbari", "Sadullapur", "Sundarganj"],
            "Kurigram": ["Bhurungamari", "Char Rajibpur", "Kurigram Sadar", "Nageshwari", "Rajarhat"],
            "Lalmonirhat": ["Aditmari", "Hatibandha", "Kaliganj", "Lalmonirhat Sadar", "Patgram"],
            "Nilphamari": ["Dimla", "Domar", "Jaldhaka", "Kishoreganj", "Nilphamari Sadar"],
            "Panchagarh": ["Atwari", "Boda", "Debiganj", "Panchagarh Sadar", "Tetulia"],
            "Rangpur": ["Badarganj", "Gangachara", "Kaunia", "Mithapukur", "Rangpur Sadar"],
            "Thakurgaon": ["Baliadangi", "Haripur", "Pirganj", "Ranisankail", "Thakurgaon Sadar"]
        }
    },
    "Mymensingh": {
        "districts": {
            "Jamalpur": ["Bakshiganj", "Dewanganj", "Islampur", "Jamalpur Sadar", "Madarganj"],
            "Mymensingh": ["Bhaluka", "Dhobaura", "Fulbaria", "Gaffargaon", "Mymensingh Sadar"],
            "Netrokona": ["Atpara", "Barhatta", "Durgapur", "Khaliajuri", "Netrokona Sadar"],
            "Sherpur": ["Jhenaigati", "Nakla", "Nalitabari", "Sherpur Sadar", "Sreebardi"]
        }
    }
}


def get_divisions():
    """Get list of all divisions"""
    return list(BANGLADESH_LOCATIONS.keys())


def get_districts(division: str):
    """Get list of districts for a division"""
    if division in BANGLADESH_LOCATIONS:
        return list(BANGLADESH_LOCATIONS[division]["districts"].keys())
    return []


def get_upazilas(division: str, district: str):
    """Get list of upazilas for a district"""
    if division in BANGLADESH_LOCATIONS:
        districts = BANGLADESH_LOCATIONS[division]["districts"]
        if district in districts:
            return districts[district]
    return []


def validate_location(division: str, district: str, upazila: str = None):
    """Validate if location hierarchy is valid"""
    if division not in BANGLADESH_LOCATIONS:
        return False
    
    districts = BANGLADESH_LOCATIONS[division]["districts"]
    if district not in districts:
        return False
    
    if upazila and upazila not in districts[district]:
        return False
    
    return True
