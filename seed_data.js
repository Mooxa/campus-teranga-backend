const mongoose = require('mongoose');
const Formation = require('./models/Formation');
const Service = require('./models/Service');
const Event = require('./models/Event');

const seedData = async () => {
  try {
    // Clear existing data
    await Formation.deleteMany({});
    await Service.deleteMany({});
    await Event.deleteMany({});

    // Seed Formations
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
          }
        ]
      }
    ];

    await Formation.insertMany(formations);

    // Seed Services
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
        name: 'Taxi',
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
        features: ['Disponible 24h/24', 'Prix négociable'],
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
        name: 'Carte de séjour',
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
        name: 'Autorisation de travail',
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
      }
    ];

    await Service.insertMany(services);

    // Seed Events
    const events = [
      {
        title: 'Soirée d\'accueil',
        description: 'Soirée de bienvenue pour tous les nouveaux étudiants étrangers. Découvrez la culture sénégalaise et rencontrez d\'autres étudiants internationaux.',
        date: new Date('2024-03-15'),
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
        date: new Date('2024-03-22'),
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
      }
    ];

    await Event.insertMany(events);

    console.log('Sample data seeded successfully!');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
};

module.exports = seedData;
