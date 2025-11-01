const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: './config.env' });

const Formation = require('./models/Formation');
const Service = require('./models/Service');
const Event = require('./models/Event');
const User = require('./models/User');
const Community = require('./src/models/Community');

const seedProductionData = async (options = {}) => {
  let shouldDisconnect = false;
  
  // Configuration from environment variables or options
  const CLEAR_ALL = options.clearAll || process.env.CLEAR_ALL === 'true';
  const CLEAR_COLLECTIONS = options.clearCollections || 
    (process.env.CLEAR_COLLECTIONS ? process.env.CLEAR_COLLECTIONS.split(',').map(c => c.trim()) : []);
  const FORCE_SEED = options.force || process.env.FORCE_SEED === 'true';
  const SEED_EMPTY_ONLY = options.seedEmptyOnly || process.env.SEED_EMPTY_ONLY === 'true';
  
  try {
    console.log('🌱 Starting production data seeding...');
    console.log('⚙️  Configuration:');
    console.log(`   - CLEAR_ALL: ${CLEAR_ALL}`);
    console.log(`   - CLEAR_COLLECTIONS: ${CLEAR_COLLECTIONS.length > 0 ? CLEAR_COLLECTIONS.join(', ') : 'none'}`);
    console.log(`   - FORCE_SEED: ${FORCE_SEED}`);
    console.log(`   - SEED_EMPTY_ONLY: ${SEED_EMPTY_ONLY}`);
    
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

    // Check existing data counts
    const existingFormations = await Formation.countDocuments();
    const existingServices = await Service.countDocuments();
    const existingEvents = await Event.countDocuments();
    const existingUsers = await User.countDocuments();
    const existingCommunities = await Community.countDocuments();

    console.log('\n📊 Current database state:');
    console.log(`   - Formations: ${existingFormations}`);
    console.log(`   - Services: ${existingServices}`);
    console.log(`   - Events: ${existingEvents}`);
    console.log(`   - Users: ${existingUsers}`);
    console.log(`   - Communities: ${existingCommunities}`);

    // Clear collections if requested
    if (CLEAR_ALL) {
      console.log('\n🗑️  Clearing ALL collections...');
      await Formation.deleteMany({});
      await Service.deleteMany({});
      await Event.deleteMany({});
      await Community.deleteMany({});
      // Don't delete all users, only non-admin users if specified
      if (options.clearUsers) {
        await User.deleteMany({ role: { $ne: 'admin', $ne: 'super_admin' } });
      }
      console.log('✅ All collections cleared');
    } else if (CLEAR_COLLECTIONS.length > 0) {
      console.log(`\n🗑️  Clearing specified collections: ${CLEAR_COLLECTIONS.join(', ')}...`);
      if (CLEAR_COLLECTIONS.includes('formations') || CLEAR_COLLECTIONS.includes('Formation')) {
        await Formation.deleteMany({});
        console.log('✅ Formations cleared');
      }
      if (CLEAR_COLLECTIONS.includes('services') || CLEAR_COLLECTIONS.includes('Service')) {
        await Service.deleteMany({});
        console.log('✅ Services cleared');
      }
      if (CLEAR_COLLECTIONS.includes('events') || CLEAR_COLLECTIONS.includes('Event')) {
        await Event.deleteMany({});
        console.log('✅ Events cleared');
      }
      if (CLEAR_COLLECTIONS.includes('communities') || CLEAR_COLLECTIONS.includes('Community')) {
        await Community.deleteMany({});
        console.log('✅ Communities cleared');
      }
      if (CLEAR_COLLECTIONS.includes('users') || CLEAR_COLLECTIONS.includes('User')) {
        await User.deleteMany({ role: { $ne: 'admin', $ne: 'super_admin' } });
        console.log('✅ Users cleared (except admins)');
      }
    }

    // Check if we should skip seeding (only if SEED_EMPTY_ONLY is true and data exists)
    if (SEED_EMPTY_ONLY && !CLEAR_ALL && CLEAR_COLLECTIONS.length === 0) {
      const hasAnyData = existingFormations > 0 || existingServices > 0 || 
                        existingEvents > 0 || existingUsers > 0 || existingCommunities > 0;
      if (hasAnyData) {
        console.log('\n⚠️  SEED_EMPTY_ONLY is enabled and data exists.');
        console.log('🔄 Skipping seeding. Use CLEAR_ALL=true or CLEAR_COLLECTIONS to clear specific collections.');
        return;
      }
    }

    // Seed Admin Users (always check/create if not exists)
    console.log('\n👤 Creating admin users...');
    
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
    const currentFormationsCount = await Formation.countDocuments();
    if (currentFormationsCount === 0 || FORCE_SEED) {
      console.log('\n🏫 Creating formations...');
    } else {
      console.log(`\n⏭️  Skipping formations (${currentFormationsCount} already exist). Use --force to override.`);
    }
    
    if (currentFormationsCount === 0 || FORCE_SEED) {
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
    }

    // Seed Services
    const currentServicesCount = await Service.countDocuments();
    if (currentServicesCount === 0 || FORCE_SEED) {
      console.log('\n🚌 Creating services...');
    } else {
      console.log(`\n⏭️  Skipping services (${currentServicesCount} already exist). Use --force to override.`);
    }
    
    if (currentServicesCount === 0 || FORCE_SEED) {
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
    }

    // Seed Events
    const currentEventsCount = await Event.countDocuments();
    if (currentEventsCount === 0 || FORCE_SEED) {
      console.log('\n🎉 Creating events...');
    } else {
      console.log(`\n⏭️  Skipping events (${currentEventsCount} already exist). Use --force to override.`);
    }
    
    if (currentEventsCount === 0 || FORCE_SEED) {
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
    }

    // Seed Communities
    const currentCommunitiesCount = await Community.countDocuments();
    if (currentCommunitiesCount === 0 || FORCE_SEED) {
      console.log('\n👥 Creating communities...');
    } else {
      console.log(`\n⏭️  Skipping communities (${currentCommunitiesCount} already exist). Use --force to override.`);
    }
    
    let communitiesCreated = 0;
    if (currentCommunitiesCount === 0 || FORCE_SEED) {
      // Get admin users for community creators
      const adminUser = await User.findOne({ role: 'admin' });
      const superAdminUser = await User.findOne({ role: 'super_admin' });
      
      if (!adminUser || !superAdminUser) {
        console.log('⚠️  Admin users not found, skipping community creation');
      } else {
        const communities = [
          // Social Communities
        {
          name: 'Étudiants Internationaux Dakar',
          description: 'Communauté pour les étudiants internationaux à Dakar. Partages, conseils, et entraide pour faciliter votre intégration au Sénégal. Posez vos questions sur la vie étudiante, les formalités administratives, et découvrez la culture sénégalaise.',
          image: '',
          category: 'social',
          creator: adminUser._id,
          members: [
            {
              user: adminUser._id,
              role: 'owner',
              joinedAt: new Date()
            }
          ],
          posts: [],
          isPublic: true,
          isActive: true
        },
        {
          name: 'Étudiants UCAD - Université Cheikh Anta Diop',
          description: 'Communauté officielle des étudiants de l\'UCAD. Échanges académiques, partage de ressources, annonces importantes et entraide entre étudiants de toutes les facultés.',
          image: '',
          category: 'social',
          creator: adminUser._id,
          members: [
            {
              user: adminUser._id,
              role: 'owner',
              joinedAt: new Date()
            }
          ],
          posts: [],
          isPublic: true,
          isActive: true
        },
        {
          name: 'Étudiants en Colocation Dakar',
          description: 'Trouvez un colocataire ou partagez votre appartement. Conseils sur les quartiers, budgets, et bonnes pratiques pour la colocation étudiante à Dakar.',
          image: '',
          category: 'social',
          creator: superAdminUser._id,
          members: [
            {
              user: superAdminUser._id,
              role: 'owner',
              joinedAt: new Date()
            }
          ],
          posts: [],
          isPublic: true,
          isActive: true
        },
        
        // Academic Communities
        {
          name: 'Étudiants en Médecine',
          description: 'Communauté dédiée aux étudiants en médecine. Partages d\'expériences, conseils sur les stages, préparations aux examens, et soutien entre pairs dans cette filière exigeante.',
          image: '',
          category: 'academic',
          creator: superAdminUser._id,
          members: [
            {
              user: superAdminUser._id,
              role: 'owner',
              joinedAt: new Date()
            }
          ],
          posts: [],
          isPublic: true,
          isActive: true
        },
        {
          name: 'Étudiants en Informatique et Tech',
          description: 'Communauté pour les étudiants en informatique, génie logiciel, et technologies. Partagez vos projets, demandez de l\'aide sur vos cours, et découvrez les dernières innovations.',
          image: '',
          category: 'academic',
          creator: adminUser._id,
          members: [
            {
              user: adminUser._id,
              role: 'owner',
              joinedAt: new Date()
            }
          ],
          posts: [],
          isPublic: true,
          isActive: true
        },
        {
          name: 'Étudiants en Économie et Gestion',
          description: 'Échangez sur vos cours, partagez vos notes, et discutez des opportunités dans le domaine de l\'économie et de la gestion au Sénégal et à l\'international.',
          image: '',
          category: 'academic',
          creator: adminUser._id,
          members: [
            {
              user: adminUser._id,
              role: 'owner',
              joinedAt: new Date()
            }
          ],
          posts: [],
          isPublic: true,
          isActive: true
        },
        {
          name: 'Étudiants en Droit',
          description: 'Communauté pour les futurs juristes. Discussions sur les cours, stages, préparations aux concours, et échanges sur le système juridique sénégalais.',
          image: '',
          category: 'academic',
          creator: superAdminUser._id,
          members: [
            {
              user: superAdminUser._id,
              role: 'owner',
              joinedAt: new Date()
            }
          ],
          posts: [],
          isPublic: true,
          isActive: true
        },
        {
          name: 'Étudiants en Langues et Littérature',
          description: 'Pour les passionnés de langues, littérature française, anglaise, et wolof. Échanges culturels, clubs de lecture, et discussions sur la littérature africaine.',
          image: '',
          category: 'academic',
          creator: adminUser._id,
          members: [
            {
              user: adminUser._id,
              role: 'owner',
              joinedAt: new Date()
            }
          ],
          posts: [],
          isPublic: true,
          isActive: true
        },
        
        // Professional Communities
        {
          name: 'Développeurs Tech Sénégal',
          description: 'Communauté de développeurs et passionnés de technologie au Sénégal. Échangez sur les dernières technologies, projets open-source, hackathons, et opportunités de carrière dans le tech.',
          image: '',
          category: 'professional',
          creator: adminUser._id,
          members: [
            {
              user: adminUser._id,
              role: 'owner',
              joinedAt: new Date()
            }
          ],
          posts: [],
          isPublic: true,
          isActive: true
        },
        {
          name: 'Jobbing Étudiants Dakar',
          description: 'Opportunités de jobs étudiants à Dakar. Partagez vos expériences, trouvez des opportunités de babysitting, tutorat, vente, et autres jobs étudiants compatibles avec vos études.',
          image: '',
          category: 'professional',
          creator: superAdminUser._id,
          members: [
            {
              user: superAdminUser._id,
              role: 'owner',
              joinedAt: new Date()
            }
          ],
          posts: [],
          isPublic: true,
          isActive: true
        },
        {
          name: 'Stages et Alternance Étudiants',
          description: 'Trouvez des stages et opportunités d\'alternance à Dakar. Conseils pour vos candidatures, partage d\'offres, et retours d\'expérience sur les entreprises locales.',
          image: '',
          category: 'professional',
          creator: adminUser._id,
          members: [
            {
              user: adminUser._id,
              role: 'owner',
              joinedAt: new Date()
            }
          ],
          posts: [],
          isPublic: true,
          isActive: true
        },
        {
          name: 'Entrepreneurs Étudiants Sénégal',
          description: 'Communauté pour les étudiants entrepreneurs et ceux qui souhaitent lancer leur startup. Partagez vos idées, trouvez des cofondateurs, et bénéficiez de conseils d\'experts.',
          image: '',
          category: 'professional',
          creator: superAdminUser._id,
          members: [
            {
              user: superAdminUser._id,
              role: 'owner',
              joinedAt: new Date()
            }
          ],
          posts: [],
          isPublic: true,
          isActive: true
        },
        
        // Cultural Communities
        {
          name: 'Sorties et Loisirs Dakar',
          description: 'Découvrez les meilleures activités, restaurants, cinémas, concerts, et lieux à visiter à Dakar avec d\'autres étudiants. Organisez des sorties de groupe et découvrez la vie culturelle dakaroise.',
          image: '',
          category: 'cultural',
          creator: adminUser._id,
          members: [
            {
              user: adminUser._id,
              role: 'owner',
              joinedAt: new Date()
            }
          ],
          posts: [],
          isPublic: true,
          isActive: true
        },
        {
          name: 'Musique et Arts Dakar',
          description: 'Pour les amateurs de musique, danse, peinture, et arts en général. Organisez des jam sessions, expositions étudiantes, et partagez votre passion artistique.',
          image: '',
          category: 'cultural',
          creator: adminUser._id,
          members: [
            {
              user: adminUser._id,
              role: 'owner',
              joinedAt: new Date()
            }
          ],
          posts: [],
          isPublic: true,
          isActive: true
        },
        {
          name: 'Cinéma Étudiants Dakar',
          description: 'Projections de films, discussions cinématographiques, et sorties aux festivals de cinéma à Dakar. Découvrez le cinéma africain et international.',
          image: '',
          category: 'cultural',
          creator: superAdminUser._id,
          members: [
            {
              user: superAdminUser._id,
              role: 'owner',
              joinedAt: new Date()
            }
          ],
          posts: [],
          isPublic: true,
          isActive: true
        },
        {
          name: 'Cuisine Sénégalaise - Recettes et Traditions',
          description: 'Apprenez et partagez les recettes sénégalaises traditionnelles. Organisez des ateliers cuisine, découvrez les spécialités régionales, et échangez des astuces culinaires.',
          image: '',
          category: 'cultural',
          creator: adminUser._id,
          members: [
            {
              user: adminUser._id,
              role: 'owner',
              joinedAt: new Date()
            }
          ],
          posts: [],
          isPublic: true,
          isActive: true
        },
        
        // Sports Communities
        {
          name: 'Footing Campus UCAD',
          description: 'Groupe de footing pour les étudiants de l\'UCAD. Pratiquez une activité sportive régulière, rencontrez d\'autres sportifs, et participez à des courses organisées dans Dakar.',
          image: '',
          category: 'sports',
          creator: adminUser._id,
          members: [
            {
              user: adminUser._id,
              role: 'owner',
              joinedAt: new Date()
            }
          ],
          posts: [],
          isPublic: true,
          isActive: true
        },
        {
          name: 'Basket Étudiants Dakar',
          description: 'Organisez des matchs de basketball entre étudiants. Entraînements réguliers, tournois, et équipes mixtes pour tous les niveaux.',
          image: '',
          category: 'sports',
          creator: superAdminUser._id,
          members: [
            {
              user: superAdminUser._id,
              role: 'owner',
              joinedAt: new Date()
            }
          ],
          posts: [],
          isPublic: true,
          isActive: true
        },
        {
          name: 'Football Étudiants - 5 vs 5',
          description: 'Matchs de foot à 5 entre étudiants. Organisez des tournois, trouvez des joueurs, et profitez de terrains accessibles à Dakar pour jouer régulièrement.',
          image: '',
          category: 'sports',
          creator: adminUser._id,
          members: [
            {
              user: adminUser._id,
              role: 'owner',
              joinedAt: new Date()
            }
          ],
          posts: [],
          isPublic: true,
          isActive: true
        },
        {
          name: 'Fitness et Musculation Étudiants',
          description: 'Conseils fitness, programmes d\'entraînement adaptés aux étudiants, recommandations de salles de sport abordables à Dakar, et motivation entre membres.',
          image: '',
          category: 'sports',
          creator: superAdminUser._id,
          members: [
            {
              user: superAdminUser._id,
              role: 'owner',
              joinedAt: new Date()
            }
          ],
          posts: [],
          isPublic: true,
          isActive: true
        },
        
        // Other Communities
        {
          name: 'Échanges Linguistiques Dakar',
          description: 'Pratiquez et perfectionnez vos langues : français, anglais, wolof, espagnol. Organisez des tandems linguistiques et sessions de conversation entre étudiants.',
          image: '',
          category: 'other',
          creator: adminUser._id,
          members: [
            {
              user: adminUser._id,
              role: 'owner',
              joinedAt: new Date()
            }
          ],
          posts: [],
          isPublic: true,
          isActive: true
        },
        {
          name: 'Bénévolat et Actions Solidaires',
          description: 'Rejoignez des actions bénévoles, associations caritatives, et projets solidaires à Dakar. Contribuez à des causes qui vous tiennent à cœur tout en rencontrant d\'autres étudiants engagés.',
          image: '',
          category: 'other',
          creator: superAdminUser._id,
          members: [
            {
              user: superAdminUser._id,
              role: 'owner',
              joinedAt: new Date()
            }
          ],
          posts: [],
          isPublic: true,
          isActive: true
        },
        {
          name: 'Lecture et Club de Livres',
          description: 'Club de lecture pour étudiants passionnés de livres. Partagez vos coups de cœur, participez à des échanges littéraires, et découvrez la bibliothèque universitaire.',
          image: '',
          category: 'other',
          creator: adminUser._id,
          members: [
            {
              user: adminUser._id,
              role: 'owner',
              joinedAt: new Date()
            }
          ],
          posts: [],
          isPublic: true,
          isActive: true
        }
      ];

        await Community.insertMany(communities);
        communitiesCreated = communities.length;
        console.log(`✅ Created ${communities.length} communities`);
      }
    } else {
      console.log(`⏭️  Communities already exist, skipping...`);
    }

    // Final summary
    const finalFormationsCount = await Formation.countDocuments();
    const finalServicesCount = await Service.countDocuments();
    const finalEventsCount = await Event.countDocuments();
    const finalUsersCount = await User.countDocuments();
    const finalCommunitiesCount = await Community.countDocuments();

    console.log('\n🎉 Production data seeding completed successfully!');
    console.log('\n📊 Final Database Summary:');
    console.log(`   - Admin users: 2 (checked/created)`);
    console.log(`   - Formations: ${finalFormationsCount}`);
    console.log(`   - Services: ${finalServicesCount}`);
    console.log(`   - Events: ${finalEventsCount}`);
    console.log(`   - Communities: ${finalCommunitiesCount}`);
    console.log(`   - Total Users: ${finalUsersCount}`);

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
  // Parse command line arguments
  const args = process.argv.slice(2);
  const options = {
    clearAll: args.includes('--clear-all') || args.includes('-c'),
    force: args.includes('--force') || args.includes('-f'),
    seedEmptyOnly: args.includes('--empty-only') || args.includes('-e'),
    clearUsers: args.includes('--clear-users'),
  };

  // Parse CLEAR_COLLECTIONS from args
  const clearCollectionsIndex = args.indexOf('--clear-collections');
  if (clearCollectionsIndex !== -1 && args[clearCollectionsIndex + 1]) {
    options.clearCollections = args[clearCollectionsIndex + 1].split(',').map(c => c.trim());
  }

  // Help message
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🌱 Production Data Seeding Script

Usage:
  node seed_production.js [options]

Options:
  --clear-all, -c          Clear all collections before seeding
  --clear-collections <list>  Clear specific collections (comma-separated)
                              Available: formations,services,events,communities,users
  --clear-users            Clear non-admin users when using --clear-all
  --force, -f              Force seed even if data exists (overrides SEED_EMPTY_ONLY)
  --empty-only, -e         Only seed if collections are empty
  --help, -h               Show this help message

Environment Variables:
  CLEAR_ALL=true                    Clear all collections
  CLEAR_COLLECTIONS=formations,events  Clear specific collections
  FORCE_SEED=true                   Force seed even if data exists
  SEED_EMPTY_ONLY=true              Only seed empty collections

Examples:
  # Clear all and seed fresh data
  node seed_production.js --clear-all

  # Clear only formations and communities, then seed
  node seed_production.js --clear-collections formations,communities

  # Seed only if collections are empty
  node seed_production.js --empty-only

  # Force seed regardless of existing data
  node seed_production.js --force
`);
    process.exit(0);
  }

  seedProductionData(options)
    .then(() => {
      console.log('\n✅ Seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = seedProductionData;
