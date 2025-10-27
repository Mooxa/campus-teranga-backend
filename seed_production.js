const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: './config.env' });

const Formation = require('./models/Formation');
const Service = require('./models/Service');
const Event = require('./models/Event');
const User = require('./models/User');

const seedProductionData = async () => {
  let shouldDisconnect = false;
  
  try {
    console.log('🌱 Starting production data seeding...');
    
    // Only connect if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
      });
      console.log('✅ Connected to MongoDB');
      shouldDisconnect = true;
    } else {
      console.log('✅ Using existing MongoDB connection');
    }

    // Check if data already exists
    const existingFormations = await Formation.countDocuments();
    const existingServices = await Service.countDocuments();
    const existingEvents = await Event.countDocuments();
    const existingUsers = await User.countDocuments();

    if (existingFormations > 0 || existingServices > 0 || existingEvents > 0 || existingUsers > 0) {
      console.log('⚠️  Data already exists in database:');
      console.log(`   - Formations: ${existingFormations}`);
      console.log(`   - Services: ${existingServices}`);
      console.log(`   - Events: ${existingEvents}`);
      console.log(`   - Users: ${existingUsers}`);
      console.log('🔄 Skipping seeding to avoid duplicates...');
      return;
    }

    // Seed Admin Users
    console.log('👤 Creating admin users...');
    
    const adminUsers = [
      {
        fullName: 'Admin Campus Teranga',
        phoneNumber: '+221771234568',
        email: 'admin@campus-teranga.com',
        password: 'Admin123',
        country: 'Sénégal',
        university: 'Campus Teranga',
        role: 'admin'
      },
      {
        fullName: 'Super Admin',
        phoneNumber: '+221771234569',
        email: 'superadmin@campus-teranga.com',
        password: 'SuperAdmin123',
        country: 'Sénégal',
        university: 'Campus Teranga',
        role: 'super_admin'
      }
    ];

    for (const userData of adminUsers) {
      const existingUser = await User.findOne({ phoneNumber: userData.phoneNumber });
      if (!existingUser) {
        const user = new User(userData);
        await user.save();
        console.log(`✅ Created ${userData.role}: ${userData.fullName}`);
      } else {
        console.log(`⚠️  ${userData.role} already exists: ${existingUser.fullName}`);
      }
    }

    // Seed Formations
    console.log('🏫 Creating formations...');
    const formations = [
      {
        name: 'Université Cheikh Anta Diop',
        shortName: 'UCAD',
        type: 'public',
        location: {
          city: 'Dakar',
          district: 'Fann',
          address: 'Avenue Cheikh Anta Diop, BP 5005'
        },
        description: 'L\'Université Cheikh Anta Diop est la plus grande université publique du Sénégal, offrant une formation de qualité dans de nombreux domaines.',
        image: '',
        website: 'https://www.ucad.sn',
        phone: '+221 33 825 98 90',
        email: 'contact@ucad.sn',
        programs: [
          {
            name: 'Informatique',
            level: 'Master',
            duration: '2 ans',
            language: 'Français'
          },
          {
            name: 'Économie',
            level: 'Licence',
            duration: '3 ans',
            language: 'Français'
          },
          {
            name: 'Médecine',
            level: 'Doctorat',
            duration: '7 ans',
            language: 'Français'
          }
        ]
      },
      {
        name: 'Université Amadou Hampâté Bâ',
        shortName: 'UAHB',
        type: 'public',
        location: {
          city: 'Dakar',
          district: 'Plateau',
          address: 'Avenue Léopold Sédar Senghor'
        },
        description: 'Université publique spécialisée dans les sciences humaines et sociales.',
        image: '',
        website: 'https://www.uahb.sn',
        phone: '+221 33 821 00 00',
        email: 'info@uahb.sn',
        programs: [
          {
            name: 'Sciences Politiques',
            level: 'Master',
            duration: '2 ans',
            language: 'Français'
          },
          {
            name: 'Sociologie',
            level: 'Licence',
            duration: '3 ans',
            language: 'Français'
          }
        ]
      },
      {
        name: 'Université Privée de Dakar',
        shortName: 'UPD',
        type: 'private',
        location: {
          city: 'Dakar',
          district: 'Almadies',
          address: 'Route de la Corniche Ouest'
        },
        description: 'Université privée offrant des formations modernes et adaptées au marché du travail.',
        image: '',
        website: 'https://www.upd.sn',
        phone: '+221 33 820 00 00',
        email: 'contact@upd.sn',
        programs: [
          {
            name: 'Gestion',
            level: 'Master',
            duration: '2 ans',
            language: 'Français'
          },
          {
            name: 'Ingénierie',
            level: 'Master',
            duration: '2 ans',
            language: 'Français'
          }
        ]
      },
      {
        name: 'École Supérieure Polytechnique',
        shortName: 'ESP',
        type: 'public',
        location: {
          city: 'Dakar',
          district: 'Fann',
          address: 'Avenue Cheikh Anta Diop'
        },
        description: 'École d\'ingénieurs de l\'UCAD, spécialisée dans les sciences et technologies.',
        image: '',
        website: 'https://www.esp.sn',
        phone: '+221 33 825 98 90',
        email: 'contact@esp.sn',
        programs: [
          {
            name: 'Génie Informatique',
            level: 'Master',
            duration: '2 ans',
            language: 'Français'
          },
          {
            name: 'Génie Civil',
            level: 'Master',
            duration: '2 ans',
            language: 'Français'
          }
        ]
      }
    ];

    await Formation.insertMany(formations);
    console.log(`✅ Created ${formations.length} formations`);

    // Seed Services
    console.log('🚌 Creating services...');
    const services = [
      {
        name: 'Bus Dakar Dem Dikk',
        category: 'transport',
        subcategory: 'bus',
        description: 'Service de transport public urbain de Dakar. Prix abordable pour les étudiants.',
        price: {
          amount: 150,
          currency: 'FCFA',
          period: 'per_trip'
        },
        location: {
          city: 'Dakar',
          district: 'Tous',
          address: 'Réseau urbain de Dakar'
        },
        contact: {
          phone: '+221 33 821 00 00',
          email: 'info@demdikk.sn',
          website: 'https://www.demdikk.sn'
        },
        image: '',
        features: ['Climatisé', 'WiFi gratuit', 'Accessible PMR'],
        rating: 4.2
      },
      {
        name: 'Taxi Orange',
        category: 'transport',
        subcategory: 'taxi',
        description: 'Service de taxi disponible 24h/24 dans toute la ville de Dakar.',
        price: {
          amount: 1500,
          currency: 'FCFA',
          period: 'per_trip'
        },
        location: {
          city: 'Dakar',
          district: 'Tous',
          address: 'Toute la ville'
        },
        contact: {
          phone: '+221 33 821 00 00',
          email: '',
          website: ''
        },
        image: '',
        features: ['Disponible 24h/24', 'Prix négociable', 'Application mobile'],
        rating: 4.0
      },
      {
        name: 'Train Express Régional',
        category: 'transport',
        subcategory: 'train',
        description: 'Service de train reliant Dakar aux banlieues. Horaires: 6h - 22h.',
        price: {
          amount: 500,
          currency: 'FCFA',
          period: 'per_trip'
        },
        location: {
          city: 'Dakar',
          district: 'Plateau',
          address: 'Gare de Dakar'
        },
        contact: {
          phone: '+221 33 821 00 00',
          email: 'info@ter.sn',
          website: 'https://www.ter.sn'
        },
        image: '',
        features: ['Rapide', 'Confortable', 'Horaires réguliers'],
        rating: 4.5
      },
      {
        name: 'Résidence Campus Fann',
        category: 'housing',
        subcategory: 'rooms',
        description: 'Résidence étudiante moderne située près de l\'UCAD. Chambres individuelles et partagées disponibles.',
        price: {
          amount: 45000,
          currency: 'FCFA',
          period: 'per_month'
        },
        location: {
          city: 'Dakar',
          district: 'Fann',
          address: 'Avenue Cheikh Anta Diop'
        },
        contact: {
          phone: '+221 33 825 98 90',
          email: 'residence@campusfann.sn',
          website: ''
        },
        image: '',
        features: ['WiFi inclus', 'Sécurité 24h/24', 'Cafétéria', 'Laverie'],
        rating: 4.3
      },
      {
        name: 'Résidence Campus UDP',
        category: 'housing',
        subcategory: 'apartments',
        description: 'Appartements modernes pour étudiants avec toutes les commodités.',
        price: {
          amount: 100000,
          currency: 'FCFA',
          period: 'per_month'
        },
        location: {
          city: 'Dakar',
          district: 'Almadies',
          address: 'Route de la Corniche Ouest'
        },
        contact: {
          phone: '+221 33 820 00 00',
          email: 'residence@upd.sn',
          website: ''
        },
        image: '',
        features: ['Appartement complet', 'Climatisé', 'Piscine', 'Gym'],
        rating: 4.7
      },
      {
        name: 'Carte de séjour étudiant',
        category: 'procedures',
        subcategory: 'visa',
        description: 'Procédure d\'obtention de la carte de séjour pour étudiants étrangers.',
        price: {
          amount: 50000,
          currency: 'FCFA',
          period: 'one_time'
        },
        location: {
          city: 'Dakar',
          district: 'Plateau',
          address: 'Direction de la Police des Étrangers'
        },
        contact: {
          phone: '+221 33 821 00 00',
          email: 'etrangers@police.sn',
          website: ''
        },
        image: '',
        features: ['Assistance complète', 'Suivi du dossier', 'Renouvellement'],
        rating: 4.0
      },
      {
        name: 'Autorisation de travail étudiant',
        category: 'procedures',
        subcategory: 'work_permit',
        description: 'Autorisation de travail pour étudiants étrangers au Sénégal.',
        price: {
          amount: 25000,
          currency: 'FCFA',
          period: 'one_time'
        },
        location: {
          city: 'Dakar',
          district: 'Plateau',
          address: 'Ministère du Travail'
        },
        contact: {
          phone: '+221 33 821 00 00',
          email: 'travail@gouv.sn',
          website: ''
        },
        image: '',
        features: ['Dossier complet', 'Suivi administratif'],
        rating: 3.8
      },
      {
        name: 'Banque CBAO',
        category: 'other',
        subcategory: 'banking',
        description: 'Ouverture de compte bancaire pour étudiants étrangers.',
        price: {
          amount: 10000,
          currency: 'FCFA',
          period: 'one_time'
        },
        location: {
          city: 'Dakar',
          district: 'Plateau',
          address: 'Avenue Léopold Sédar Senghor'
        },
        contact: {
          phone: '+221 33 821 00 00',
          email: 'info@cbao.sn',
          website: 'https://www.cbao.sn'
        },
        image: '',
        features: ['Compte gratuit étudiants', 'Carte bancaire', 'Application mobile'],
        rating: 4.1
      }
    ];

    await Service.insertMany(services);
    console.log(`✅ Created ${services.length} services`);

    // Seed Events
    console.log('🎉 Creating events...');
    const events = [
      {
        title: 'Soirée d\'accueil étudiants internationaux',
        description: 'Soirée de bienvenue pour tous les nouveaux étudiants étrangers. Découvrez la culture sénégalaise et rencontrez d\'autres étudiants internationaux.',
        date: new Date('2024-09-15'),
        time: '19:00',
        location: {
          name: 'Centre Culturel Blaise Diagne',
          address: 'Avenue Léopold Sédar Senghor',
          city: 'Dakar'
        },
        category: 'welcome',
        image: '',
        organizer: {
          name: 'Campus Teranga',
          contact: {
            phone: '+221 33 821 00 00',
            email: 'contact@campusteranga.sn'
          }
        },
        capacity: 200,
        registeredUsers: [],
        isFree: true,
        price: {
          amount: 0,
          currency: 'FCFA'
        },
        requirements: ['Carte d\'étudiant', 'Pièce d\'identité']
      },
      {
        title: 'Atelier de cuisine sénégalaise',
        description: 'Apprenez à préparer les plats traditionnels sénégalais avec des chefs locaux.',
        date: new Date('2024-09-22'),
        time: '14:00',
        location: {
          name: 'École de Cuisine Dakar',
          address: 'Rue de la République',
          city: 'Dakar'
        },
        category: 'cultural',
        image: '',
        organizer: {
          name: 'École de Cuisine Dakar',
          contact: {
            phone: '+221 33 821 00 00',
            email: 'info@cuisinedakar.sn'
          }
        },
        capacity: 30,
        registeredUsers: [],
        isFree: false,
        price: {
          amount: 15000,
          currency: 'FCFA'
        },
        requirements: ['Inscription préalable', 'Tablier de cuisine']
      },
      {
        title: 'Forum des emplois étudiants',
        description: 'Rencontrez des employeurs et découvrez les opportunités de jobs étudiants à Dakar.',
        date: new Date('2024-10-05'),
        time: '09:00',
        location: {
          name: 'Palais des Congrès',
          address: 'Avenue Cheikh Anta Diop',
          city: 'Dakar'
        },
        category: 'academic',
        image: '',
        organizer: {
          name: 'Campus Teranga',
          contact: {
            phone: '+221 33 821 00 00',
            email: 'career@campusteranga.sn'
          }
        },
        capacity: 500,
        registeredUsers: [],
        isFree: true,
        price: {
          amount: 0,
          currency: 'FCFA'
        },
        requirements: ['CV', 'Carte d\'étudiant']
      },
      {
        title: 'Excursion à l\'île de Gorée',
        description: 'Visite historique de l\'île de Gorée, site du patrimoine mondial de l\'UNESCO.',
        date: new Date('2024-10-12'),
        time: '08:00',
        location: {
          name: 'Port de Dakar',
          address: 'Quai d\'embarquement',
          city: 'Dakar'
        },
        category: 'cultural',
        image: '',
        organizer: {
          name: 'Campus Teranga',
          contact: {
            phone: '+221 33 821 00 00',
            email: 'tours@campusteranga.sn'
          }
        },
        capacity: 50,
        registeredUsers: [],
        isFree: false,
        price: {
          amount: 8000,
          currency: 'FCFA'
        },
        requirements: ['Pièce d\'identité', 'Chaussures confortables']
      }
    ];

    await Event.insertMany(events);
    console.log(`✅ Created ${events.length} events`);

    console.log('🎉 Production data seeding completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - Admin users: 2`);
    console.log(`   - Formations: ${formations.length}`);
    console.log(`   - Services: ${services.length}`);
    console.log(`   - Events: ${events.length}`);

  } catch (error) {
    console.error('❌ Error seeding production data:', error);
    throw error;
  } finally {
    // Only disconnect if we connected in this function
    if (shouldDisconnect) {
      await mongoose.disconnect();
      console.log('🔌 Disconnected from MongoDB');
    } else {
      console.log('✅ Keeping MongoDB connection alive');
    }
  }
};

// Run if called directly
if (require.main === module) {
  seedProductionData()
    .then(() => {
      console.log('✅ Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = seedProductionData;
