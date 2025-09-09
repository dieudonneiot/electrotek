const firebaseConfig = {
apiKey: "AIzaSyCUkmcTFBUP83gdRwTjKbzlY-nTUS_kwhg",
authDomain: "electrotekbase.firebaseapp.com",
projectId: "electrotekbase",
storageBucket: "electrotekbase.firebasestorage.app",
messagingSenderId: "89012410968",
appId: "1:89012410968:web:889c25817a204b1562082d",
measurementId: "G-1HZQG2KWNY"
};
// Initialiser Firebase
let db, storage;
try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    storage = firebase.storage();
} catch (error) {
    console.error("Erreur d'initialisation Firebase. Utilisation des données de démonstration.", error);
}

// Références aux collections
const productsRef = db ? db.collection("products") : null;
const projectsRef = db ? db.collection("projects") : null;
const coursesRef = db ? db.collection("courses") : null;

// État de l'application
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentUser = null;
let currentSlide = 0;
let slideInterval;

// Données de démonstration
const demoProducts = [
    {
        id: "1",
        name: "Kit Arduino Uno Starter",
        description: "Kit complet pour débuter avec Arduino Uno, incluant carte, câbles, capteurs et LEDs.",
        price: 29.99,
        category: "arduino",
        stock: 15,
        imageUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
    },
    {
        id: "2",
        name: "Capteur Ultrason HC-SR04",
        description: "Capteur de distance à ultrasons pour projets de robotique et domotique.",
        price: 4.99,
        category: "capteurs",
        stock: 42,
        imageUrl: "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
    },
    {
        id: "3",
        name: "Servomoteur MG90S",
        description: "Servomoteur de haute précision pour projets de robotique et modélisme.",
        price: 8.50,
        category: "moteurs",
        stock: 28,
        imageUrl: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
    },
    {
        id: "4",
        name: "LED RGB 5mm",
        description: "LED RVB 5mm à cathode commune pour effets lumineux multicolores.",
        price: 0.99,
        category: "leds",
        stock: 200,
        imageUrl: "https://images.unsplash.com/photo-1605812860427-4024433a70fd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
    }
];

const demoProjects = [
    {
        id: "1",
        name: "Robot Suiveur de Ligne",
        description: "Apprenez à construire un robot capable de suivre une ligne noire sur un sol blanc. Ce projet est parfait pour débuter en robotique.",
        difficulty: "débutant",
        imageUrl: "https://images.unsplash.com/photo-1581093458799-1084c2f12b29?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
    },
    {
        id: "2",
        name: "Station Météo Connectée",
        description: "Créez votre propre station météo avec capteurs de température, humidité et pression, et visualisez les données sur un écran LCD.",
        difficulty: "intermédiaire",
        imageUrl: "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
    }
];

const demoCourses = [
    {
        id: "1",
        title: "Introduction à l'Électronique",
        description: "Découvrez les bases de l'électronique : composants, circuits, et notions fondamentales.",
        level: "débutant"
    },
    {
        id: "2",
        title: "Programmation Arduino Avancée",
        description: "Maîtrisez la programmation avancée d'Arduino pour des projets complexes.",
        level: "avancé"
    }
];

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    initHeroSlider();
    loadContent();
    updateCartCount();
    
    // Écouteurs pour les formulaires admin
    document.getElementById('product-form').addEventListener('submit', addProduct);
    document.getElementById('project-form').addEventListener('submit', addProject);
    document.getElementById('course-form').addEventListener('submit', addCourse);
    
    // Écouteur pour le bouton de commande
    document.getElementById('checkout-btn').addEventListener('click', checkout);
    
    // Menu mobile
    document.querySelector('.menu-toggle').addEventListener('click', function() {
        this.classList.toggle('active');
        document.querySelector('nav ul').classList.toggle('active');
    });
});

// Initialiser le slider hero
function initHeroSlider() {
    const slides = document.querySelectorAll('.hero-slide');
    const indicators = document.querySelectorAll('.indicator');
    
    // Fonction pour changer de slide
    function goToSlide(index) {
        slides.forEach(slide => slide.classList.remove('active'));
        indicators.forEach(indicator => indicator.classList.remove('active'));
        
        slides[index].classList.add('active');
        indicators[index].classList.add('active');
        currentSlide = index;
    }
    
    // Événements pour les indicateurs
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            clearInterval(slideInterval);
            goToSlide(index);
            startSlideTimer();
        });
    });
    
    // Démarrer le timer pour le défilement automatique
    startSlideTimer();
}

function startSlideTimer() {
    clearInterval(slideInterval);
    slideInterval = setInterval(() => {
        currentSlide = (currentSlide + 1) % 3;
        goToSlide(currentSlide);
    }, 5000);
}

// Navigation entre les sections
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('data-section');
            showSection(sectionId);
            
            // Mettre à jour la classe active
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // Fermer le menu mobile si ouvert
            document.querySelector('nav ul').classList.remove('active');
            document.querySelector('.menu-toggle').classList.remove('active');
        });
    });
    
    // Boutons de la hero section
    document.querySelectorAll('.hero-buttons .btn, .feature-card .btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const sectionId = this.getAttribute('data-section');
            showSection(sectionId);
            
            // Mettre à jour la classe active
            navLinks.forEach(l => l.classList.remove('active'));
            document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');
        });
    });
    
    // Onglets admin
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            showTab(tabId);
        });
    });
    
    // Onglets de gestion
    const manageTabButtons = document.querySelectorAll('.manage-tab-btn');
    manageTabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-manage-tab');
            showManageTab(tabId);
        });
    });
    
    // Fermer la modal
    document.querySelector('.close').addEventListener('click', function() {
        document.getElementById('product-modal').style.display = 'none';
    });
    
    // Fermer la modal en cliquant à l'extérieur
    window.addEventListener('click', function(event) {
        if (event.target == document.getElementById('product-modal')) {
            document.getElementById('product-modal').style.display = 'none';
        }
    });

    // Liens du footer
    document.querySelectorAll('.footer-section a').forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.getAttribute('data-section')) {
                e.preventDefault();
                const sectionId = this.getAttribute('data-section');
                showSection(sectionId);
                
                // Mettre à jour la classe active
                navLinks.forEach(l => l.classList.remove('active'));
                document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');
            }
        });
    });
}

function showSection(sectionId) {
    // Cacher toutes les sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Afficher la section demandée
    document.getElementById(sectionId).classList.add('active');
    
    // Charger le contenu si nécessaire
    if (sectionId === 'products') {
        loadProducts();
    } else if (sectionId === 'projects') {
        loadProjects();
    } else if (sectionId === 'courses') {
        loadCourses();
    } else if (sectionId === 'cart') {
        loadCart();
    } else if (sectionId === 'admin') {
        loadAdminContent();
    }
    
    // Scroll to top
    window.scrollTo(0, 0);
}

function showTab(tabId) {
    // Désactiver tous les onglets
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Cacher tous les contenus d'onglets
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
        content.classList.remove('active');
    });
    
    // Activer l'onglet demandé
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById(tabId).classList.add('active');
}

function showManageTab(tabId) {
    // Désactiver tous les onglets de gestion
    const tabs = document.querySelectorAll('.manage-tab-btn');
    tabs.forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Cacher tous les contenus d'onglets de gestion
    const tabContents = document.querySelectorAll('.manage-tab-content');
    tabContents.forEach(content => {
        content.classList.remove('active');
    });
    
    // Activer l'onglet de gestion demandé
    document.querySelector(`[data-manage-tab="${tabId}"]`).classList.add('active');
    document.getElementById(`manage-${tabId}`).classList.add('active');
}

// Chargement du contenu
function loadContent() {
    loadFeaturedProducts();
}

function loadFeaturedProducts() {
    const featuredProducts = document.getElementById('products-list');
    featuredProducts.innerHTML = '';
    
    demoProducts.forEach(product => {
        const productCard = createProductCard(product);
        featuredProducts.appendChild(productCard);
    });
}

function loadProducts() {
    const productsList = document.getElementById('products-list');
    productsList.innerHTML = '<div class="loading"><div class="loading-spinner"></div></div>';
    
    productsRef.orderBy('createdAt', 'desc').get().then((querySnapshot) => {
        productsList.innerHTML = '';
        
        if (querySnapshot.empty) {
            productsList.innerHTML = '<p class="empty-message">Aucun produit disponible.</p>';
            return;
        }
        
        querySnapshot.forEach((doc) => {
            const product = { id: doc.id, ...doc.data() };
            const productCard = createProductCard(product);
            productsList.appendChild(productCard);
        });
        
        // Filtrer les produits
        document.getElementById('category-filter').addEventListener('change', filterProducts);
        document.getElementById('search-products').addEventListener('input', filterProducts);
    }).catch((error) => {
        console.error("Erreur lors du chargement des produits: ", error);
        productsList.innerHTML = '<p class="error-message">Erreur lors du chargement des produits.</p>';
        
        // Fallback aux données de démonstration
        demoProducts.forEach(product => {
            const productCard = createProductCard(product);
            productsList.appendChild(productCard);
        });
    });
}

// Initialiser Firebase
try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    storage = firebase.storage();
    
    // Vérifier la connexion
    db.enablePersistence().catch((err) => {
        if (err.code == 'failed-precondition') {
            console.warn("Multiple tabs open, persistence can only be enabled in one tab at a time.");
        } else if (err.code == 'unimplemented') {
            console.warn("The current browser doesn't support all of the features required to enable persistence.");
        }
    });
} catch (error) {
    console.error("Erreur d'initialisation Firebase. Utilisation des données de démonstration.", error);
    // Vous pouvez afficher une notification à l'utilisateur
    showNotification("Mode hors ligne activé - Données de démonstration", "error");
}


function createProductCard(product) {
    const productCard = document.createElement('div');
    productCard.className = 'product-card';
    productCard.setAttribute('data-category', product.category);
    
    productCard.innerHTML = `
        <div class="card-image">
            <img src="${product.imageUrl || 'https://via.placeholder.com/300x200?text=Composant'}" alt="${product.name}">
        </div>
        <div class="card-content">
            <h3>${product.name}</h3>
            <p>${product.description.substring(0, 100)}...</p>
            <div class="price">${product.price} €</div>
            <div class="card-actions">
                <button class="btn btn-secondary view-product" data-id="${product.id}">
                    <i class="fas fa-eye"></i> Détails
                </button>
                <button class="btn btn-primary add-to-cart" data-id="${product.id}">
                    <i class="fas fa-cart-plus"></i> Ajouter
                </button>
            </div>
        </div>
    `;
    
    // Ajouter les écouteurs d'événements
    productCard.querySelector('.view-product').addEventListener('click', function() {
        viewProduct(product.id);
    });
    
    productCard.querySelector('.add-to-cart').addEventListener('click', function() {
        addToCart(product.id);
    });
    
    return productCard;
}

function filterProducts() {
    const category = document.getElementById('category-filter').value;
    const searchText = document.getElementById('search-products').value.toLowerCase();
    
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
        const productName = card.querySelector('h3').textContent.toLowerCase();
        const productDescription = card.querySelector('p').textContent.toLowerCase();
        const productCategory = card.getAttribute('data-category') || '';
        
        const matchesCategory = category === 'all' || productCategory === category;
        const matchesSearch = productName.includes(searchText) || productDescription.includes(searchText);
        
        if (matchesCategory && matchesSearch) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

function loadProjects() {
    const projectsList = document.getElementById('projects-list');
    projectsList.innerHTML = '<div class="loading"><div class="loading-spinner"></div></div>';
    
    // Simuler un chargement asynchrone
    setTimeout(() => {
        projectsList.innerHTML = '';
        
        demoProjects.forEach(project => {
            const projectCard = document.createElement('div');
            projectCard.className = 'project-card';
            projectCard.innerHTML = `
                <div class="card-image">
                    <img src="${project.imageUrl || 'https://via.placeholder.com/300x200?text=Projet'}" alt="${project.name}">
                </div>
                <div class="card-content">
                    <h3>${project.name}</h3>
                    <p>${project.description.substring(0, 100)}...</p>
                    <p><strong>Niveau:</strong> ${project.difficulty}</p>
                    <div class="card-actions">
                        <button class="btn btn-primary">
                            <i class="fas fa-file-pdf"></i> Notice
                        </button>
                    </div>
                </div>
            `;
            
            projectsList.appendChild(projectCard);
        });
    }, 500);
}

function loadCourses() {
    const coursesList = document.getElementById('courses-list');
    coursesList.innerHTML = '<div class="loading"><div class="loading-spinner"></div></div>';
    
    // Simuler un chargement asynchrone
    setTimeout(() => {
        coursesList.innerHTML = '';
        
        demoCourses.forEach(course => {
            const courseCard = document.createElement('div');
            courseCard.className = 'course-card';
            courseCard.innerHTML = `
                <div class="card-image">
                    <img src="https://via.placeholder.com/300x200?text=Cours" alt="${course.title}">
                </div>
                <div class="card-content">
                    <h3>${course.title}</h3>
                    <p>${course.description.substring(0, 100)}...</p>
                    <p><strong>Niveau:</strong> ${course.level}</p>
                    <div class="card-actions">
                        <button class="btn btn-primary">
                            <i class="fas fa-book-open"></i> Voir le cours
                        </button>
                    </div>
                </div>
            `;
            
            coursesList.appendChild(courseCard);
        });
    }, 500);
}

function viewProduct(productId) {
    const product = demoProducts.find(p => p.id === productId);
    if (product) {
        const modalContent = document.getElementById('modal-product-details');
        
        modalContent.innerHTML = `
            <h2>${product.name}</h2>
            <img src="${product.imageUrl || 'https://via.placeholder.com/300x200?text=Composant'}" alt="${product.name}" style="max-width: 100%; margin: 1rem 0; border-radius: 8px;">
            <p><strong>Description:</strong> ${product.description}</p>
            <p><strong>Prix:</strong> ${product.price} €</p>
            <p><strong>Catégorie:</strong> ${product.category}</p>
            <p><strong>Stock:</strong> ${product.stock || 'Non spécifié'}</p>
            <button class="btn btn-primary add-to-cart-modal" data-id="${productId}" style="margin-top: 1rem;">
                <i class="fas fa-cart-plus"></i> Ajouter au panier
            </button>
        `;
        
        document.getElementById('product-modal').style.display = 'block';
        
        // Ajouter l'écouteur d'événement pour le bouton d'ajout au panier
        document.querySelector('.add-to-cart-modal').addEventListener('click', function() {
            addToCart(productId);
            document.getElementById('product-modal').style.display = 'none';
        });
    }
}

function addToCart(productId) {
    const product = demoProducts.find(p => p.id === productId);
    
    if (product) {
        // Vérifier si le produit est déjà dans le panier
        const existingItem = cart.find(item => item.id === productId);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                imageUrl: product.imageUrl,
                quantity: 1
            });
        }
        
        // Mettre à jour le stockage local et le compteur
        updateLocalStorage();
        updateCartCount();
        
        // Afficher une notification
        showNotification('Produit ajouté au panier!');
    }
}

function showNotification(message, type = 'success') {
    // Supprimer les notifications existantes
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => {
        document.body.removeChild(notification);
    });
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}`;
    
    document.body.appendChild(notification);
    
    // Animation d'entrée
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Supprimer après 3 secondes
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function loadCart() {
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total-price');
    
    cartItems.innerHTML = '';
    let total = 0;
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-cart">Votre panier est vide.</p>';
        cartTotal.textContent = '0';
        return;
    }
    
    cart.forEach(item => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="cart-item-info">
                <img src="${item.imageUrl || 'https://via.placeholder.com/60x60?text=Produit'}" alt="${item.name}">
                <div>
                    <h4>${item.name}</h4>
                    <p>Prix unitaire: ${item.price} €</p>
                </div>
            </div>
            <div class="cart-item-actions">
                <button class="btn btn-secondary decrease-quantity" data-id="${item.id}">
                    <i class="fas fa-minus"></i>
                </button>
                <span>${item.quantity}</span>
                <button class="btn btn-secondary increase-quantity" data-id="${item.id}">
                    <i class="fas fa-plus"></i>
                </button>
                <button class="btn btn-secondary remove-from-cart" data-id="${item.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        cartItems.appendChild(cartItem);
        total += item.price * item.quantity;
    });
    
    cartTotal.textContent = total.toFixed(2);
    
    // Ajouter les écouteurs d'événements
    document.querySelectorAll('.increase-quantity').forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            updateQuantity(productId, 1);
        });
    });
    
    document.querySelectorAll('.decrease-quantity').forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            updateQuantity(productId, -1);
        });
    });
    
    document.querySelectorAll('.remove-from-cart').forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            removeFromCart(productId);
        });
    });
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    
    if (item) {
        item.quantity += change;
        
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            updateLocalStorage();
            updateCartCount();
            loadCart();
        }
    }
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateLocalStorage();
    updateCartCount();
    loadCart();
    showNotification('Produit retiré du panier');
}

function updateLocalStorage() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartCount() {
    const cartCount = document.getElementById('cart-count');
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    cartCount.textContent = totalItems;
}

function checkout() {
    if (cart.length === 0) {
        showNotification('Votre panier est vide!', 'error');
        return;
    }
    
    let message = "Bonjour, je souhaite commander les articles suivants:%0A%0A";
    let total = 0;
    
    cart.forEach(item => {
        message += `- ${item.name} (x${item.quantity}) : ${item.price * item.quantity} €%0A`;
        total += item.price * item.quantity;
    });
    
    message += `%0ATotal: ${total} €`;
    
    const whatsappLink = document.getElementById('whatsapp-link');
    const phoneNumber = "1234567890"; // Remplacez par votre numéro
    
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
}

// Fonctions d'administration
function loadAdminContent() {
    loadAdminProducts();
    loadAdminProjects();
    loadAdminCourses();
}

function loadAdminProducts() {
    const adminProductsList = document.getElementById('admin-products-list');
    adminProductsList.innerHTML = '';
    
    demoProducts.forEach(product => {
        const productItem = document.createElement('div');
        productItem.className = 'admin-item';
        productItem.innerHTML = `
            <div class="admin-item-content">
                <h4>${product.name}</h4>
                <p>${product.description.substring(0, 100)}...</p>
                <p><strong>Prix:</strong> ${product.price} € | <strong>Catégorie:</strong> ${product.category} | <strong>Stock:</strong> ${product.stock || 'N/A'}</p>
            </div>
            <div class="admin-item-actions">
                <button class="btn btn-secondary delete-product" data-id="${product.id}">
                    <i class="fas fa-trash"></i> Supprimer
                </button>
            </div>
        `;
        
        adminProductsList.appendChild(productItem);
    });
    
    // Ajouter les écouteurs d'événements pour la suppression
    document.querySelectorAll('.delete-product').forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            deleteProduct(productId);
        });
    });
}

function loadAdminProjects() {
    const adminProjectsList = document.getElementById('admin-projects-list');
    adminProjectsList.innerHTML = '';
    
    demoProjects.forEach(project => {
        const projectItem = document.createElement('div');
        projectItem.className = 'admin-item';
        projectItem.innerHTML = `
            <div class="admin-item-content">
                <h4>${project.name}</h4>
                <p>${project.description.substring(0, 100)}...</p>
                <p><strong>Niveau:</strong> ${project.difficulty}</p>
            </div>
            <div class="admin-item-actions">
                <button class="btn btn-secondary delete-project" data-id="${project.id}">
                    <i class="fas fa-trash"></i> Supprimer
                </button>
            </div>
        `;
        
        adminProjectsList.appendChild(projectItem);
    });
}

function loadAdminCourses() {
    const adminCoursesList = document.getElementById('admin-courses-list');
    adminCoursesList.innerHTML = '';
    
    demoCourses.forEach(course => {
        const courseItem = document.createElement('div');
        courseItem.className = 'admin-item';
        courseItem.innerHTML = `
            <div class="admin-item-content">
                <h4>${course.title}</h4>
                <p>${course.description.substring(0, 100)}...</p>
                <p><strong>Niveau:</strong> ${course.level}</p>
            </div>
            <div class="admin-item-actions">
                <button class="btn btn-secondary delete-course" data-id="${course.id}">
                    <i class="fas fa-trash"></i> Supprimer
                </button>
            </div>
        `;
        
        adminCoursesList.appendChild(courseItem);
    });
}

/* The above code defines a JavaScript function called `addProduct` that takes a parameter `e`.
However, the function body is enclosed in triple hash symbols (` */
function addProduct(e) {
    e.preventDefault();
    
    const name = document.getElementById('product-name').value;
    const description = document.getElementById('product-description').value;
    const price = parseFloat(document.getElementById('product-price').value);
    const category = document.getElementById('product-category').value;
    const stock = parseInt(document.getElementById('product-stock').value) || 0;
    const imageFile = document.getElementById('product-image').files[0];
    
    if (!name || !description || !price) {
        showNotification('Veuillez remplir tous les champs obligatoires.', 'error');
        return;
    }
    
    // Upload de l'image si elle existe
    if (imageFile) {
        const storageRef = storage.ref(`products/${Date.now()}_${imageFile.name}`);
        storageRef.put(imageFile).then((snapshot) => {
            return snapshot.ref.getDownloadURL();
        }).then((downloadURL) => {
            // Ajouter le produit avec l'URL de l'image
            return productsRef.add({
                name,
                description,
                price,
                category,
                stock,
                imageUrl: downloadURL,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }).then(() => {
            showNotification('Produit ajouté avec succès!');
            document.getElementById('product-form').reset();
        }).catch((error) => {
            console.error("Erreur lors de l'ajout du produit: ", error);
            showNotification("Erreur lors de l'ajout du produit", 'error');
        });
    } else {
        // Ajouter le produit sans image
        productsRef.add({
            name,
            description,
            price,
            category,
            stock,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            showNotification('Produit ajouté avec succès!');
            document.getElementById('product-form').reset();
        }).catch((error) => {
            console.error("Erreur lors de l'ajout du produit: ", error);
            showNotification("Erreur lors de l'ajout du produit", 'error');
        });
    }
}
function addProject(e) {
    e.preventDefault();
    
    const name = document.getElementById('project-name').value;
    const description = document.getElementById('project-description').value;
    const difficulty = document.getElementById('project-difficulty').value;
    
    // Vérifier les champs obligatoires
    if (!name || !description || !difficulty) {
        showNotification('Veuillez remplir tous les champs obligatoires.', 'error');
        return;
    }
    
    showNotification('Projet ajouté avec succès!');
    document.getElementById('project-form').reset();
}

function addCourse(e) {
    e.preventDefault();
    
    const title = document.getElementById('course-title').value;
    const description = document.getElementById('course-description').value;
    const level = document.getElementById('course-level').value;
    
    // Vérifier les champs obligatoires
    if (!title || !description || !level) {
        showNotification('Veuillez remplir tous les champs obligatoires.', 'error');
        return;
    }
    
    showNotification('Cours ajouté avec succès!');
    document.getElementById('course-form').reset();
}

function deleteProduct(productId) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit?')) {
        const index = demoProducts.findIndex(p => p.id === productId);
        if (index !== -1) {
            demoProducts.splice(index, 1);
            showNotification('Produit supprimé avec succès!');
            loadAdminProducts();
            loadProducts();
        }
    }
}