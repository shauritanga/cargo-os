<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class CountriesCitiesSeeder extends Seeder
{
    public function run(): void
    {
        $data = [
            ['name' => 'Afghanistan', 'code' => 'AF', 'cities' => ['Kabul', 'Kandahar', 'Herat', 'Mazar-i-Sharif', 'Jalalabad']],
            ['name' => 'Algeria', 'code' => 'DZ', 'cities' => ['Algiers', 'Oran', 'Constantine', 'Annaba', 'Blida', 'Tlemcen']],
            ['name' => 'Angola', 'code' => 'AO', 'cities' => ['Luanda', 'Huambo', 'Lobito', 'Benguela', 'Namibe']],
            ['name' => 'Argentina', 'code' => 'AR', 'cities' => ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'La Plata', 'Tucumán', 'Mar del Plata']],
            ['name' => 'Australia', 'code' => 'AU', 'cities' => ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Canberra', 'Darwin', 'Fremantle']],
            ['name' => 'Austria', 'code' => 'AT', 'cities' => ['Vienna', 'Graz', 'Linz', 'Salzburg', 'Innsbruck']],
            ['name' => 'Azerbaijan', 'code' => 'AZ', 'cities' => ['Baku', 'Ganja', 'Sumqayit', 'Mingəçevir']],
            ['name' => 'Bangladesh', 'code' => 'BD', 'cities' => ['Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Comilla', 'Mymensingh']],
            ['name' => 'Belgium', 'code' => 'BE', 'cities' => ['Brussels', 'Antwerp', 'Ghent', 'Bruges', 'Liège', 'Namur']],
            ['name' => 'Brazil', 'code' => 'BR', 'cities' => ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza', 'Recife', 'Manaus', 'Porto Alegre', 'Belém', 'Santos']],
            ['name' => 'Bulgaria', 'code' => 'BG', 'cities' => ['Sofia', 'Plovdiv', 'Varna', 'Burgas', 'Ruse']],
            ['name' => 'Cambodia', 'code' => 'KH', 'cities' => ['Phnom Penh', 'Siem Reap', 'Sihanoukville', 'Battambang']],
            ['name' => 'Cameroon', 'code' => 'CM', 'cities' => ['Douala', 'Yaoundé', 'Garoua', 'Bamenda', 'Bafoussam']],
            ['name' => 'Canada', 'code' => 'CA', 'cities' => ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Edmonton', 'Ottawa', 'Winnipeg', 'Quebec City', 'Halifax', 'Hamilton']],
            ['name' => 'Chile', 'code' => 'CL', 'cities' => ['Santiago', 'Valparaíso', 'Concepción', 'Antofagasta', 'Viña del Mar', 'Temuco']],
            ['name' => 'China', 'code' => 'CN', 'cities' => ['Shanghai', 'Beijing', 'Guangzhou', 'Shenzhen', 'Tianjin', 'Wuhan', 'Chengdu', 'Qingdao', 'Ningbo', 'Dalian', 'Xiamen', 'Nanjing', 'Hangzhou']],
            ['name' => 'Colombia', 'code' => 'CO', 'cities' => ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga']],
            ['name' => 'Côte d\'Ivoire', 'code' => 'CI', 'cities' => ['Abidjan', 'Bouaké', 'Daloa', 'Yamoussoukro', 'San-Pédro']],
            ['name' => 'Croatia', 'code' => 'HR', 'cities' => ['Zagreb', 'Split', 'Rijeka', 'Osijek', 'Zadar']],
            ['name' => 'Czech Republic', 'code' => 'CZ', 'cities' => ['Prague', 'Brno', 'Ostrava', 'Plzeň', 'Liberec']],
            ['name' => 'Denmark', 'code' => 'DK', 'cities' => ['Copenhagen', 'Aarhus', 'Odense', 'Aalborg', 'Frederiksberg']],
            ['name' => 'DR Congo', 'code' => 'CD', 'cities' => ['Kinshasa', 'Lubumbashi', 'Mbuji-Mayi', 'Kananga', 'Kisangani', 'Matadi']],
            ['name' => 'Ecuador', 'code' => 'EC', 'cities' => ['Quito', 'Guayaquil', 'Cuenca', 'Ambato', 'Manta']],
            ['name' => 'Egypt', 'code' => 'EG', 'cities' => ['Cairo', 'Alexandria', 'Port Said', 'Suez', 'Luxor', 'Aswan', 'Giza', 'Damietta']],
            ['name' => 'Ethiopia', 'code' => 'ET', 'cities' => ['Addis Ababa', 'Dire Dawa', 'Adama', 'Mekelle', 'Gondar', 'Hawassa', 'Bahir Dar']],
            ['name' => 'Finland', 'code' => 'FI', 'cities' => ['Helsinki', 'Espoo', 'Tampere', 'Vantaa', 'Oulu', 'Turku']],
            ['name' => 'France', 'code' => 'FR', 'cities' => ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Bordeaux', 'Nantes', 'Le Havre', 'Strasbourg', 'Montpellier']],
            ['name' => 'Germany', 'code' => 'DE', 'cities' => ['Hamburg', 'Frankfurt', 'Berlin', 'Munich', 'Düsseldorf', 'Cologne', 'Bremen', 'Stuttgart', 'Leipzig', 'Bremerhaven']],
            ['name' => 'Ghana', 'code' => 'GH', 'cities' => ['Accra', 'Kumasi', 'Tamale', 'Sekondi-Takoradi', 'Cape Coast', 'Tema']],
            ['name' => 'Greece', 'code' => 'GR', 'cities' => ['Athens', 'Thessaloniki', 'Patras', 'Heraklion', 'Piraeus', 'Volos']],
            ['name' => 'Hong Kong', 'code' => 'HK', 'cities' => ['Hong Kong', 'Kowloon', 'New Territories', 'Lantau Island']],
            ['name' => 'Hungary', 'code' => 'HU', 'cities' => ['Budapest', 'Debrecen', 'Miskolc', 'Szeged', 'Pécs']],
            ['name' => 'India', 'code' => 'IN', 'cities' => ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad', 'Surat', 'Jaipur', 'Nhava Sheva', 'Kochi', 'Visakhapatnam']],
            ['name' => 'Indonesia', 'code' => 'ID', 'cities' => ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Makassar', 'Semarang', 'Palembang', 'Denpasar', 'Tanjung Priok']],
            ['name' => 'Iran', 'code' => 'IR', 'cities' => ['Tehran', 'Mashhad', 'Isfahan', 'Karaj', 'Shiraz', 'Tabriz', 'Bandar Abbas', 'Ahvaz']],
            ['name' => 'Iraq', 'code' => 'IQ', 'cities' => ['Baghdad', 'Basra', 'Mosul', 'Erbil', 'Kirkuk', 'Najaf', 'Umm Qasr']],
            ['name' => 'Ireland', 'code' => 'IE', 'cities' => ['Dublin', 'Cork', 'Limerick', 'Galway', 'Waterford']],
            ['name' => 'Israel', 'code' => 'IL', 'cities' => ['Tel Aviv', 'Jerusalem', 'Haifa', 'Ashdod', 'Eilat']],
            ['name' => 'Italy', 'code' => 'IT', 'cities' => ['Rome', 'Milan', 'Naples', 'Turin', 'Palermo', 'Genoa', 'Venice', 'Bologna', 'Livorno', 'Gioia Tauro']],
            ['name' => 'Japan', 'code' => 'JP', 'cities' => ['Tokyo', 'Osaka', 'Yokohama', 'Nagoya', 'Kobe', 'Fukuoka', 'Sapporo', 'Hiroshima', 'Tokyo Bay']],
            ['name' => 'Jordan', 'code' => 'JO', 'cities' => ['Amman', 'Zarqa', 'Irbid', 'Aqaba', 'Mafraq']],
            ['name' => 'Kazakhstan', 'code' => 'KZ', 'cities' => ['Almaty', 'Nur-Sultan', 'Shymkent', 'Aktobe', 'Karaganda', 'Aktau']],
            ['name' => 'Kenya', 'code' => 'KE', 'cities' => ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Malindi', 'Kisii']],
            ['name' => 'Kuwait', 'code' => 'KW', 'cities' => ['Kuwait City', 'Hawalli', 'Shuwaikh', 'Ahmadi', 'Jahra']],
            ['name' => 'Lebanon', 'code' => 'LB', 'cities' => ['Beirut', 'Tripoli', 'Sidon', 'Tyre', 'Jounieh']],
            ['name' => 'Libya', 'code' => 'LY', 'cities' => ['Tripoli', 'Benghazi', 'Misrata', 'Tobruk', 'Sabha']],
            ['name' => 'Malaysia', 'code' => 'MY', 'cities' => ['Kuala Lumpur', 'George Town', 'Ipoh', 'Johor Bahru', 'Kota Kinabalu', 'Kuching', 'Port Klang', 'Shah Alam']],
            ['name' => 'Mexico', 'code' => 'MX', 'cities' => ['Mexico City', 'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana', 'Veracruz', 'Manzanillo', 'Altamira', 'Lázaro Cárdenas']],
            ['name' => 'Morocco', 'code' => 'MA', 'cities' => ['Casablanca', 'Rabat', 'Marrakech', 'Fes', 'Tangier', 'Agadir', 'Meknes', 'Tanger Med']],
            ['name' => 'Mozambique', 'code' => 'MZ', 'cities' => ['Maputo', 'Matola', 'Beira', 'Nampula', 'Pemba', 'Nacala']],
            ['name' => 'Myanmar', 'code' => 'MM', 'cities' => ['Yangon', 'Mandalay', 'Naypyidaw', 'Mawlamyine', 'Thilawa']],
            ['name' => 'Netherlands', 'code' => 'NL', 'cities' => ['Rotterdam', 'Amsterdam', 'The Hague', 'Utrecht', 'Eindhoven', 'Groningen']],
            ['name' => 'New Zealand', 'code' => 'NZ', 'cities' => ['Auckland', 'Wellington', 'Christchurch', 'Hamilton', 'Tauranga', 'Dunedin']],
            ['name' => 'Nigeria', 'code' => 'NG', 'cities' => ['Lagos', 'Abuja', 'Kano', 'Ibadan', 'Port Harcourt', 'Benin City', 'Apapa', 'Tin Can Island', 'Warri']],
            ['name' => 'Norway', 'code' => 'NO', 'cities' => ['Oslo', 'Bergen', 'Trondheim', 'Stavanger', 'Tromsø']],
            ['name' => 'Oman', 'code' => 'OM', 'cities' => ['Muscat', 'Salalah', 'Sohar', 'Nizwa', 'Sur', 'Khasab']],
            ['name' => 'Pakistan', 'code' => 'PK', 'cities' => ['Karachi', 'Lahore', 'Islamabad', 'Faisalabad', 'Rawalpindi', 'Multan', 'Peshawar', 'Gwadar', 'Quetta']],
            ['name' => 'Peru', 'code' => 'PE', 'cities' => ['Lima', 'Callao', 'Arequipa', 'Trujillo', 'Chiclayo', 'Iquitos', 'Paita']],
            ['name' => 'Philippines', 'code' => 'PH', 'cities' => ['Manila', 'Cebu City', 'Davao', 'Quezon City', 'Zamboanga', 'Makati', 'Subic Bay']],
            ['name' => 'Poland', 'code' => 'PL', 'cities' => ['Warsaw', 'Kraków', 'Łódź', 'Wrocław', 'Poznań', 'Gdańsk', 'Gdynia', 'Szczecin']],
            ['name' => 'Portugal', 'code' => 'PT', 'cities' => ['Lisbon', 'Porto', 'Braga', 'Setúbal', 'Funchal', 'Sines', 'Aveiro']],
            ['name' => 'Qatar', 'code' => 'QA', 'cities' => ['Doha', 'Al Wakrah', 'Al Khor', 'Umm Salal', 'Lusail', 'Hamad Port']],
            ['name' => 'Romania', 'code' => 'RO', 'cities' => ['Bucharest', 'Cluj-Napoca', 'Timișoara', 'Iași', 'Constanța', 'Brașov']],
            ['name' => 'Russia', 'code' => 'RU', 'cities' => ['Moscow', 'Saint Petersburg', 'Novosibirsk', 'Vladivostok', 'Yekaterinburg', 'Vostochny', 'Nakhodka', 'Murmansk']],
            ['name' => 'Rwanda', 'code' => 'RW', 'cities' => ['Kigali', 'Butare', 'Gisenyi', 'Ruhengeri', 'Kibungo']],
            ['name' => 'Saudi Arabia', 'code' => 'SA', 'cities' => ['Riyadh', 'Jeddah', 'Dammam', 'Mecca', 'Medina', 'Jubail', 'Yanbu', 'Dhahran', 'King Abdullah Port']],
            ['name' => 'Senegal', 'code' => 'SN', 'cities' => ['Dakar', 'Thiès', 'Kaolack', 'Saint-Louis', 'Ziguinchor']],
            ['name' => 'Singapore', 'code' => 'SG', 'cities' => ['Singapore', 'Jurong', 'Woodlands', 'Tampines', 'Tuas']],
            ['name' => 'South Africa', 'code' => 'ZA', 'cities' => ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth', 'East London', 'Richards Bay', 'Coega']],
            ['name' => 'South Korea', 'code' => 'KR', 'cities' => ['Seoul', 'Busan', 'Incheon', 'Daegu', 'Gwangju', 'Daejeon', 'Ulsan']],
            ['name' => 'Spain', 'code' => 'ES', 'cities' => ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Bilbao', 'Málaga', 'Las Palmas', 'Algeciras', 'Cartagena']],
            ['name' => 'Sri Lanka', 'code' => 'LK', 'cities' => ['Colombo', 'Kandy', 'Galle', 'Jaffna', 'Trincomalee', 'Negombo']],
            ['name' => 'Sudan', 'code' => 'SD', 'cities' => ['Khartoum', 'Omdurman', 'Port Sudan', 'Kassala', 'El Obeid']],
            ['name' => 'Sweden', 'code' => 'SE', 'cities' => ['Stockholm', 'Gothenburg', 'Malmö', 'Uppsala', 'Linköping', 'Helsingborg']],
            ['name' => 'Switzerland', 'code' => 'CH', 'cities' => ['Zurich', 'Geneva', 'Basel', 'Bern', 'Lausanne', 'Lugano']],
            ['name' => 'Taiwan', 'code' => 'TW', 'cities' => ['Taipei', 'Kaohsiung', 'Taichung', 'Tainan', 'Hsinchu', 'Keelung']],
            ['name' => 'Tanzania', 'code' => 'TZ', 'cities' => ['Dar es Salaam', 'Dodoma', 'Arusha', 'Mwanza', 'Mbeya', 'Morogoro', 'Tanga', 'Kigoma', 'Tabora', 'Iringa', 'Moshi', 'Songea', 'Musoma', 'Bukoba', 'Sumbawanga', 'Singida', 'Shinyanga', 'Kahama', 'Geita', 'Bariadi', 'Njombe', 'Mpanda', 'Lindi', 'Mtwara Mikindani', 'Bagamoyo', 'Kibaha', 'Chalinze', 'Kisarawe', 'Mkuranga', 'Utete', 'Ikwiriri', 'Kibiti', 'Kilindoni', 'Mlandizi', 'Ifakara', 'Kilosa', 'Kidatu', 'Mlimba', 'Mahenge', 'Gairo', 'Mvomero', 'Dumila', 'Mikumi', 'Biharamulo', 'Muleba', 'Ngara', 'Benaco', 'Kyaka', 'Karagwe', 'Kayanga', 'Kyerwa', 'Kamachumu', 'Missenyi', 'Kakonko', 'Kibondo', 'Kasulu', 'Uvinza', 'Buhigwe', 'Manyovu', 'Mwandiga', 'Ilunde', 'Mlele', 'Inyonga', 'Namanyere', 'Matai', 'Laela', 'Mbinga', 'Peramiho', 'Namtumbo', 'Tunduru', 'Mbambabay', 'Liwale', 'Nachingwea', 'Ruangwa', 'Kilwa Kivinje', 'Kilwa Masoko', 'Masasi', 'Newala Kisimani', 'Tandahimba', 'Nanganga', 'Mikindani', 'Nanyamba', 'Babati', 'Mbulu', 'Katesh', 'Dongobesh', 'Kibaya', 'Orkesumet', 'Bashanet', 'Arumeru', 'Usa River', 'Ngaramtoni', 'Monduli', 'Namanga', 'Longido', 'Karatu', 'Mto wa Mbu', 'Loliondo', 'Wasso', 'Mugumu', 'Tarime', 'Bunda', 'Butiama', 'Sirari', 'Nyamuswa', 'Nansio', 'Magu', 'Misungwi', 'Kwimba', 'Sengerema', 'Itilima', 'Busega', 'Maswa', 'Meatu', 'Malampaka', 'Nyalikungu', 'Chato', 'Bukombe', 'Mbogwe', 'Nyanghwale', 'Busanda', 'Mabuki', 'Mabatini', 'Mpwapwa', 'Kongwa', 'Kondoa', 'Bahi', 'Chemba', 'Chamwino', 'Manyoni', 'Itigi', 'Kiomboi', 'Mkalama', 'Iguguno', 'Nzega', 'Igunga', 'Urambo', 'Kaliua', 'Sikonge', 'Ushetu', 'Msalala', 'Kishapu', 'Mafinga', 'Kilolo', 'Mufindi', 'Makambako', 'Wangingombe', 'Makete', 'Ludewa', 'Tukuyu', 'Kyela', 'Mbarali', 'Chunya', 'Tunduma', 'Vwawa', 'Mbozi', 'Momba', 'Mtambaswala', 'Nanyumbu', 'Chake Chake', 'Wete', 'Mkoani', 'Zanzibar City', 'Stone Town', 'Bububu', 'Mkokotoni', 'Kinyasini', 'Nungwi', 'Kendwa', 'Matemwe', 'Kiwengwa', 'Uroa', 'Chwaka', 'Michamvi', 'Paje', 'Bwejuu', 'Jambiani', 'Makunduchi', 'Kizimkazi', 'Koani', 'Chuini', 'Mangapwani', 'Mahonda', 'Dunga', 'Fumba', 'Pongwe', 'Pwani Mchangani']],
            ['name' => 'Thailand', 'code' => 'TH', 'cities' => ['Bangkok', 'Chiang Mai', 'Pattaya', 'Hat Yai', 'Phuket', 'Laem Chabang', 'Rayong']],
            ['name' => 'Tunisia', 'code' => 'TN', 'cities' => ['Tunis', 'Sfax', 'Sousse', 'Bizerte', 'Radès', 'Gabès']],
            ['name' => 'Turkey', 'code' => 'TR', 'cities' => ['Istanbul', 'Ankara', 'Izmir', 'Bursa', 'Antalya', 'Mersin', 'Trabzon', 'Iskenderun', 'Gemlik']],
            ['name' => 'Uganda', 'code' => 'UG', 'cities' => ['Kampala', 'Entebbe', 'Gulu', 'Lira', 'Mbarara', 'Jinja', 'Mbale']],
            ['name' => 'Ukraine', 'code' => 'UA', 'cities' => ['Kyiv', 'Kharkiv', 'Odessa', 'Dnipro', 'Lviv', 'Mykolaiv', 'Mariupol']],
            ['name' => 'United Arab Emirates', 'code' => 'AE', 'cities' => ['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Fujairah', 'Ras Al Khaimah', 'Al Ain', 'Jebel Ali']],
            ['name' => 'United Kingdom', 'code' => 'GB', 'cities' => ['London', 'Birmingham', 'Manchester', 'Glasgow', 'Liverpool', 'Felixstowe', 'Southampton', 'Bristol', 'Tilbury', 'Immingham']],
            ['name' => 'United States', 'code' => 'US', 'cities' => ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Dallas', 'Atlanta', 'Miami', 'Seattle', 'San Francisco', 'Boston', 'Newark', 'Baltimore', 'Savannah', 'Long Beach', 'Charleston']],
            ['name' => 'Vietnam', 'code' => 'VN', 'cities' => ['Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Haiphong', 'Cần Thơ', 'Vung Tau', 'Cai Mep']],
            ['name' => 'Yemen', 'code' => 'YE', 'cities' => ['Sana\'a', 'Aden', 'Hodeidah', 'Mukalla', 'Taiz']],
            ['name' => 'Zambia', 'code' => 'ZM', 'cities' => ['Lusaka', 'Kitwe', 'Ndola', 'Livingstone', 'Kabwe', 'Chipata']],
            ['name' => 'Zimbabwe', 'code' => 'ZW', 'cities' => ['Harare', 'Bulawayo', 'Chitungwiza', 'Mutare', 'Gweru', 'Beitbridge']],
        ];

        foreach ($data as $country) {
            // Upsert country (insert if not exists, skip if code already there)
            \DB::table('countries')->insertOrIgnore([
                'name' => $country['name'],
                'code' => $country['code'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $countryRecord = \DB::table('countries')->where('code', $country['code'])->value('id');

            if ($country['code'] === 'TZ') {
                // Replace prior Tanzania seed entries (older region placeholders) with town/city data.
                \DB::table('cities')->where('country_id', $countryRecord)->delete();
            }

            $cityRows = array_map(fn($city) => [
                'country_id' => $countryRecord,
                'name' => $city,
                'created_at' => now(),
                'updated_at' => now(),
            ], $country['cities']);

            \DB::table('cities')->insertOrIgnore($cityRows);
        }
    }
}
