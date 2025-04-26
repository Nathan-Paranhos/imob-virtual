// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Switch, Link, Redirect } from 'react-router-dom';
import './App.css';
import Logo from './components/UI/Logo';
import ThemeToggle from './components/UI/ThemeToggle';
import Login from './components/Auth/Login';
import ProfileForm from './components/Profile/ProfileForm';
import { FaHome, FaCamera, FaCube, FaUser, FaSearch, FaBell, FaPlus, FaSignOutAlt } from 'react-icons/fa';
import { logoutUser } from './services/firebase';
import { AuthProvider, useAuth } from './context/AuthContext';

// Componente de loading
const Loading = () => (
  <div className="loading-spinner">
    <div className="spinner"></div>
    <p>Carregando...</p>
  </div>
);

// Componente PrivateRoute
const PrivateRoute = ({ component: Component, ...rest }) => {
  const { currentUser } = useAuth();
  
  return (
    <Route
      {...rest}
      render={props =>
        currentUser ? (
          <Component {...props} />
        ) : (
          <Redirect to="/login" />
        )
      }
    />
  );
};

// Componentes principais
const Home = () => {
  const [properties, setProperties] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const handleAddProperty = (e) => {
    e.preventDefault();
    const newProperty = {
      id: Date.now(),
      title: e.target.title.value,
      address: e.target.address.value,
      price: e.target.price.value,
      type: e.target.type.value,
      image: 'https://via.placeholder.com/300x200'
    };
    
    setProperties([...properties, newProperty]);
    setShowAddForm(false);
    e.target.reset();
  };

  return (
    <div className="content-section">
      <div className="section-header">
        <h1>Dashboard</h1>
        <button className="btn primary" onClick={() => setShowAddForm(!showAddForm)}>
          <FaPlus /> Adicionar Imóvel
        </button>
      </div>
      
      {showAddForm && (
        <div className="content-card form-card">
          <h2>Adicionar Novo Imóvel</h2>
          <form onSubmit={handleAddProperty}>
            <div className="form-group">
              <label htmlFor="title">Título</label>
              <input type="text" id="title" name="title" required />
            </div>
            <div className="form-group">
              <label htmlFor="address">Endereço</label>
              <input type="text" id="address" name="address" required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="price">Preço (R$)</label>
                <input type="number" id="price" name="price" required />
              </div>
              <div className="form-group">
                <label htmlFor="type">Tipo</label>
                <select id="type" name="type" required>
                  <option value="apartment">Apartamento</option>
                  <option value="house">Casa</option>
                  <option value="commercial">Comercial</option>
                </select>
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn secondary" onClick={() => setShowAddForm(false)}>Cancelar</button>
              <button type="submit" className="btn primary">Salvar</button>
            </div>
          </form>
        </div>
      )}

      <div className="stats-container">
        <div className="stat-card green">
          <h3>Imóveis Disponíveis</h3>
          <div className="stat-value">{properties.length || 0}</div>
          <div className="stat-chart"></div>
        </div>
        <div className="stat-card orange">
          <h3>Valor Médio</h3>
          <div className="stat-value">
            {properties.length 
              ? `R$ ${Math.round(properties.reduce((acc, prop) => acc + Number(prop.price), 0) / properties.length / 1000)}K` 
              : 'R$ 0'}
          </div>
          <div className="stat-chart"></div>
        </div>
        <div className="stat-card red">
          <h3>Visitas Virtuais</h3>
          <div className="stat-value">0</div>
          <div className="stat-chart"></div>
        </div>
      </div>

      <div className="property-grid">
        {properties.length > 0 ? (
          properties.map(property => (
            <div key={property.id} className="property-card">
              <div className="property-image">
                <img src={property.image} alt={property.title} />
              </div>
              <div className="property-details">
                <h3>{property.title}</h3>
                <p>{property.address}</p>
                <div className="property-price">R$ {Number(property.price).toLocaleString()}</div>
                <div className="property-type">{property.type}</div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <p>Nenhum imóvel cadastrado. Clique em "Adicionar Imóvel" para começar.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const PhotoUploader = () => {
  const [selectedCategory, setSelectedCategory] = useState('rooms');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFiles = (files) => {
    const newFiles = files.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      category: selectedCategory,
      preview: URL.createObjectURL(file),
      file
    }));

    setUploadedFiles([...uploadedFiles, ...newFiles]);
  };

  const removeFile = (id) => {
    setUploadedFiles(uploadedFiles.filter(file => file.id !== id));
  };

  return (
    <div className="content-section">
      <div className="section-header">
        <h1>Gestão de Fotos</h1>
      </div>

      <div className="content-card">
        <div className="upload-container">
          <div
            className={`upload-area ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <FaCamera className="upload-icon" />
            <p>Arraste e solte suas imagens aqui ou clique para selecionar</p>
            <input
              type="file"
              id="file-upload"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <label htmlFor="file-upload" className="btn primary">Selecionar Arquivos</label>
          </div>

          <div className="category-selector">
            <h3>Categorias</h3>
            <div className="category-options">
              <button
                className={`category-btn ${selectedCategory === 'rooms' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('rooms')}
              >
                Cômodos
              </button>
              <button
                className={`category-btn ${selectedCategory === 'facade' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('facade')}
              >
                Fachada
              </button>
              <button
                className={`category-btn ${selectedCategory === 'exterior' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('exterior')}
              >
                Área Externa
              </button>
              <button
                className={`category-btn ${selectedCategory === 'other' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('other')}
              >
                Outros
              </button>
            </div>
          </div>
        </div>

        {uploadedFiles.length > 0 && (
          <div className="uploaded-files">
            <h3>Imagens Carregadas</h3>
            <div className="file-grid">
              {uploadedFiles.map(file => (
                <div key={file.id} className="file-item">
                  <img src={file.preview} alt={file.name} />
                  <div className="file-info">
                    <span className="file-name">{file.name}</span>
                    <span className="file-category">{file.category}</span>
                  </div>
                  <button className="remove-file" onClick={() => removeFile(file.id)}>×</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Editor3D = () => {
  const [activeTab, setActiveTab] = useState('rooms');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);

  const rooms = [
    { id: 1, name: 'Sala de Estar' },
    { id: 2, name: 'Quarto' },
    { id: 3, name: 'Cozinha' },
    { id: 4, name: 'Banheiro' },
    { id: 5, name: 'Varanda' }
  ];

  const materials = [
    { id: 1, name: 'Madeira', class: 'wood' },
    { id: 2, name: 'Mármore', class: 'marble' },
    { id: 3, name: 'Concreto', class: 'concrete' },
    { id: 4, name: 'Cerâmica', class: 'ceramic' }
  ];

  const colors = [
    { id: 1, hex: '#f44336' },
    { id: 2, hex: '#e91e63' },
    { id: 3, hex: '#9c27b0' },
    { id: 4, hex: '#673ab7' },
    { id: 5, hex: '#3f51b5' },
    { id: 6, hex: '#2196f3' },
    { id: 7, hex: '#4caf50' },
    { id: 8, hex: '#ff9800' },
    { id: 9, hex: '#795548' }
  ];

  const handleRoomSelect = (room) => {
    setSelectedRoom(room);
  };

  const handleMaterialSelect = (material) => {
    setSelectedMaterial(material);
  };

  const handleColorSelect = (color) => {
    setSelectedColor(color);
  };
  
  return (
    <div className="content-section">
      <div className="section-header">
        <h1>Editor 3D</h1>
      </div>
      
      <div className="content-card">
        <div className="editor-container">
          <div className="editor-canvas">
            <div className="placeholder-canvas">
              <p>Visualização 3D</p>
              <small>Selecione as ferramentas ao lado para começar a projetar</small>
            </div>
          </div>
          
          <div className="editor-controls">
            <div className="editor-tabs">
              <button 
                className={`tab-btn ${activeTab === 'rooms' ? 'active' : ''}`}
                onClick={() => setActiveTab('rooms')}
              >
                Cômodos
              </button>
              <button 
                className={`tab-btn ${activeTab === 'materials' ? 'active' : ''}`}
                onClick={() => setActiveTab('materials')}
              >
                Materiais
              </button>
              <button 
                className={`tab-btn ${activeTab === 'colors' ? 'active' : ''}`}
                onClick={() => setActiveTab('colors')}
              >
                Cores
              </button>
            </div>
            
            <div className="tab-content">
              {activeTab === 'rooms' && (
                <div className="tool-buttons">
                  {rooms.map(room => (
                    <button
                      key={room.id}
                      className={`tool-btn ${selectedRoom?.id === room.id ? 'active' : ''}`}
                      onClick={() => handleRoomSelect(room)}
                    >
                      {room.name}
                    </button>
                  ))}
                </div>
              )}
              
              {activeTab === 'materials' && (
                <div className="material-options">
                  {materials.map(material => (
                    <div
                      key={material.id}
                      className={`material-item ${selectedMaterial?.id === material.id ? 'active' : ''}`}
                      onClick={() => handleMaterialSelect(material)}
                    >
                      <div className={`material-preview ${material.class}`}></div>
                      <span>{material.name}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {activeTab === 'colors' && (
                <div className="color-picker">
                  {[0, 1, 2].map(row => (
                    <div key={row} className="color-row">
                      {colors.slice(row * 3, (row + 1) * 3).map(color => (
                        <div
                          key={color.id}
                          className={`color-swatch ${selectedColor?.id === color.id ? 'active' : ''}`}
                          style={{backgroundColor: color.hex}}
                          onClick={() => handleColorSelect(color)}
                        ></div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="editor-actions">
              <button className="btn secondary">Desfazer</button>
              <button className="btn primary">Salvar Projeto</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle('light-mode');
  };

  useEffect(() => {
    // Simula carregamento inicial
    setTimeout(() => setLoading(false), 1000);
  }, []);

  if (loading) {
    return <Loading />;
  }

  return (
    <AuthProvider>
      <Router>
        <div className={`app ${darkMode ? 'dark-mode' : 'light-mode'} ${menuOpen ? 'menu-open' : ''}`}>
          <aside className="sidebar">
            <div className="sidebar-header">
              <Logo />
              <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
                <span></span>
                <span></span>
                <span></span>
              </button>
            </div>
            <nav className="sidebar-nav">
              <ul>
                <li>
                  <Link to="/" className="nav-link">
                    <FaHome className="nav-icon" />
                    <span>Dashboard</span>
                  </Link>
                </li>
                <li>
                  <Link to="/properties" className="nav-link">
                    <FaCamera className="nav-icon" />
                    <span>Gestão de Fotos</span>
                  </Link>
                </li>
                <li>
                  <Link to="/editor" className="nav-link">
                    <FaCube className="nav-icon" />
                    <span>Editor 3D</span>
                  </Link>
                </li>
                <li>
                  <Link to="/profile" className="nav-link">
                    <FaUser className="nav-icon" />
                    <span>Perfil</span>
                  </Link>
                </li>
                <li>
                  <button className="nav-link" onClick={logoutUser}>
                    <FaSignOutAlt className="nav-icon" />
                    <span>Sair</span>
                  </button>
                </li>
              </ul>
            </nav>
            <div className="sidebar-footer">
              <ThemeToggle darkMode={darkMode} toggleTheme={toggleTheme} />
            </div>
          </aside>

          <main className="main-content">
            <header className="main-header">
              <h1 className="page-title">ImmoVision</h1>
              <div className="header-actions">
                <div className="search-bar">
                  <input type="text" placeholder="Pesquisar..." />
                  <button className="search-btn">
                    <FaSearch />
                  </button>
                </div>
                <div className="user-menu">
                  <button className="notification-btn">
                    <FaBell />
                  </button>
                  <button className="profile-btn">
                    <FaUser />
                  </button>
                </div>
              </div>
            </header>

            <div className="content">
              <Switch>
                <Route path="/login" component={Login} />
                <PrivateRoute exact path="/" component={Home} />
                <PrivateRoute path="/properties" component={PhotoUploader} />
                <PrivateRoute path="/editor" component={Editor3D} />
                <PrivateRoute path="/profile" component={ProfileForm} />
              </Switch>
            </div>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
