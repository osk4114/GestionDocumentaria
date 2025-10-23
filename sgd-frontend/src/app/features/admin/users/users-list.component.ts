import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService, UserAdmin } from '../../../core/services/user.service';
import { AreaService, Area } from '../../../core/services/area.service';
import { RoleService, Role } from '../../../core/services/role.service';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.scss'
})
export class UsersListComponent implements OnInit {
  users = signal<UserAdmin[]>([]);
  filteredUsers = signal<UserAdmin[]>([]);
  areas = signal<Area[]>([]);
  roles = signal<Role[]>([]);
  loading = signal(false);
  showModal = signal(false);
  modalMode = signal<'create' | 'edit'>('create');
  
  // Formulario
  formData = signal({
    id: 0,
    nombre: '',
    email: '',
    password: '',
    rolId: 0,
    areaId: 0,
    isActive: true
  });

  // Búsqueda y filtros
  searchTerm = '';
  filterArea = 'all';
  filterRole = 'all';
  filterStatus = 'all';

  // Mensajes
  successMessage = signal('');
  errorMessage = signal('');
  showPassword = signal(false);

  constructor(
    private userService: UserService,
    private areaService: AreaService,
    private roleService: RoleService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadAreas();
    this.loadRoles();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.userService.getAll().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.users.set(response.data);
          this.applyFilters();
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar usuarios:', error);
        this.showError('Error al cargar los usuarios');
        this.loading.set(false);
      }
    });
  }

  loadAreas(): void {
    this.areaService.getAll().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.areas.set(response.data.filter(a => a.isActive));
        }
      },
      error: (error) => console.error('Error al cargar áreas:', error)
    });
  }

  loadRoles(): void {
    this.roleService.getAll().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.roles.set(response.data);
        }
      },
      error: (error) => console.error('Error al cargar roles:', error)
    });
  }

  applyFilters(): void {
    let filtered = this.users();

    // Filtro por búsqueda
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        user.nombre.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term)
      );
    }

    // Filtro por área
    if (this.filterArea !== 'all') {
      const areaId = parseInt(this.filterArea);
      filtered = filtered.filter(user => user.areaId === areaId);
    }

    // Filtro por rol
    if (this.filterRole !== 'all') {
      const roleId = parseInt(this.filterRole);
      filtered = filtered.filter(user => user.rolId === roleId);
    }

    // Filtro por estado
    if (this.filterStatus !== 'all') {
      const isActive = this.filterStatus === 'active';
      filtered = filtered.filter(user => user.isActive === isActive);
    }

    this.filteredUsers.set(filtered);
  }

  openCreateModal(): void {
    this.modalMode.set('create');
    this.formData.set({
      id: 0,
      nombre: '',
      email: '',
      password: '',
      rolId: 0,
      areaId: 0,
      isActive: true
    });
    this.showPassword.set(false);
    this.showModal.set(true);
  }

  openEditModal(user: UserAdmin): void {
    this.modalMode.set('edit');
    this.formData.set({
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      password: '',
      rolId: user.rolId,
      areaId: user.areaId || 0,
      isActive: user.isActive
    });
    this.showPassword.set(false);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.clearMessages();
  }

  saveUser(): void {
    const data = this.formData();
    
    // Validaciones
    if (!data.nombre || !data.email || !data.rolId) {
      this.showError('Nombre, email y rol son obligatorios');
      return;
    }

    if (this.modalMode() === 'create' && !data.password) {
      this.showError('La contraseña es obligatoria para nuevos usuarios');
      return;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      this.showError('Email inválido');
      return;
    }

    this.loading.set(true);

    if (this.modalMode() === 'create') {
      // Crear nuevo usuario
      this.userService.create({
        nombre: data.nombre,
        email: data.email,
        password: data.password,
        rolId: data.rolId,
        areaId: data.areaId || undefined
      }).subscribe({
        next: (response) => {
          if (response.success) {
            this.showSuccess('Usuario creado exitosamente');
            this.loadUsers();
            this.closeModal();
          }
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error al crear usuario:', error);
          this.showError(error.error?.message || 'Error al crear el usuario');
          this.loading.set(false);
        }
      });
    } else {
      // Actualizar usuario existente
      const updateData: any = {
        nombre: data.nombre,
        email: data.email,
        rolId: data.rolId,
        areaId: data.areaId || undefined
      };

      // Solo incluir password si se ingresó uno nuevo
      if (data.password) {
        updateData.password = data.password;
      }

      this.userService.update(data.id, updateData).subscribe({
        next: (response) => {
          if (response.success) {
            this.showSuccess('Usuario actualizado exitosamente');
            this.loadUsers();
            this.closeModal();
          }
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error al actualizar usuario:', error);
          this.showError(error.error?.message || 'Error al actualizar el usuario');
          this.loading.set(false);
        }
      });
    }
  }

  toggleStatus(user: UserAdmin): void {
    if (confirm(`¿Está seguro de ${user.isActive ? 'desactivar' : 'activar'} al usuario "${user.nombre}"?`)) {
      const action = user.isActive 
        ? this.userService.deactivate(user.id)
        : this.userService.activate(user.id);

      action.subscribe({
        next: (response) => {
          if (response.success) {
            this.showSuccess(`Usuario ${user.isActive ? 'desactivado' : 'activado'} exitosamente`);
            this.loadUsers();
          }
        },
        error: (error) => {
          console.error('Error al cambiar estado:', error);
          this.showError('Error al cambiar el estado del usuario');
        }
      });
    }
  }

  deleteUser(user: UserAdmin): void {
    if (confirm(`¿Está seguro de eliminar al usuario "${user.nombre}"?\n\nEsta acción no se puede deshacer.`)) {
      this.userService.delete(user.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.showSuccess('Usuario eliminado exitosamente');
            this.loadUsers();
          }
        },
        error: (error) => {
          console.error('Error al eliminar usuario:', error);
          this.showError(error.error?.message || 'Error al eliminar el usuario');
        }
      });
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword.set(!this.showPassword());
  }

  showSuccess(message: string): void {
    this.successMessage.set(message);
    setTimeout(() => this.successMessage.set(''), 3000);
  }

  showError(message: string): void {
    this.errorMessage.set(message);
    setTimeout(() => this.errorMessage.set(''), 5000);
  }

  clearMessages(): void {
    this.successMessage.set('');
    this.errorMessage.set('');
  }
}
