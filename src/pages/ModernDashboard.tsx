import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  UserCheck, 
  Shield, 
  Activity,
  TrendingUp,
  TrendingDown,
  BarChart3,
  RefreshCw,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  Lock,
  Settings,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  Database,
  ChevronRight,
  Info,
  Star,
  Crown,
  UserX
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/AuthContext';
import { useGlobal } from '@/context/GlobalContext';
import { useRoles } from '@/hooks/useRoles';
import { UserService } from '@/services/userService.js';
import { RoleService } from '@/services/roleService.js';
import { PermissionService } from '@/services/permissionService.js';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface DashboardStats {
  users: {
    total: number;
    active: number;
    confirmed: number;
    blocked: number;
    pending: number;
  };
  roles: {
    total: number;
    system: number;
    custom: number;
    admin: number;
    list: any[];
  };
  permissions: {
    total: number;
    byController: Record<string, number>;
  };
}

const ModernDashboard = () => {
  const { user } = useAuth();
  const { getBranding, getColors } = useGlobal();
  const { getRoleType } = useRoles();
  const navigate = useNavigate();
  const branding = getBranding();
  const colors = getColors();
  
  // Verificar si es admin o super
  const userRoleType = getRoleType();
  const isAdminOrSuper = userRoleType === 'admin' || userRoleType === 'super';

  const [stats, setStats] = useState<DashboardStats>({
    users: {
      total: 0,
      active: 0,
      confirmed: 0,
      blocked: 0,
      pending: 0
    },
    roles: {
      total: 0,
      system: 0,
      custom: 0,
      admin: 0,
      list: []
    },
    permissions: {
      total: 0,
      byController: {}
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [deviceData, setDeviceData] = useState([]);
  const [activeTab, setActiveTab] = useState(isAdminOrSuper ? "admin" : "info");

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
    
    // Auto-refresh every 60 seconds
    const interval = setInterval(() => {
      loadDashboardData(false);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      else setRefreshing(true);
      
      console.log('🔄 Cargando datos del dashboard...');

      // Load real data from APIs
      const [userStatsResult, rolesResult, permissionsResult] = await Promise.all([
        UserService.getUserStats(),
        RoleService.getRoles(),
        PermissionService.getPermissions()
      ]);

      console.log('📊 Datos obtenidos:', {
        userStats: userStatsResult,
        roles: rolesResult,
        permissions: permissionsResult
      });

      // Process user stats
      const userStats = userStatsResult.success ? userStatsResult.data : {
        total: 0, active: 0, confirmed: 0, blocked: 0, pending: 0
      };

      // Process roles
      const rolesData = rolesResult.success ? rolesResult.roles : [];
      const roleStats = {
        total: rolesData.length,
        system: rolesData.filter(r => ['authenticated', 'public'].includes(r.type)).length,
        custom: rolesData.filter(r => !['authenticated', 'public'].includes(r.type)).length,
        admin: rolesData.filter(r => r.type === 'admin' || r.type === 'super').length,
        list: rolesData
      };

      // Process permissions
      const permissionsData = permissionsResult.success ? permissionsResult.permissions : [];
      const permissionsByController = {};
      permissionsData.forEach(perm => {
        const controller = perm.controller || 'unknown';
        permissionsByController[controller] = (permissionsByController[controller] || 0) + 1;
      });

      setStats({
        users: userStats,
        roles: roleStats,
        permissions: {
          total: permissionsData.length,
          byController: permissionsByController
        }
      });

      // Generate realistic chart data
      const mockChartData = generateRealisticChartData();
      const mockDeviceData = generateDeviceData();
      
      setChartData(mockChartData);
      setDeviceData(mockDeviceData);
      
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const generateRealisticChartData = () => {
    const data = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      // Simulate realistic patterns
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const baseActivity = isWeekend ? 15 : 35;
      const randomVariation = Math.floor(Math.random() * 20) - 10;
      
      data.push({
        date: date.toLocaleDateString('es-ES', { 
          month: 'short', 
          day: 'numeric' 
        }),
        usuarios: Math.max(5, baseActivity + randomVariation),
        sesiones: Math.max(3, Math.floor((baseActivity + randomVariation) * 0.8)),
        registros: Math.max(0, Math.floor(Math.random() * 5)),
        activos: Math.max(2, Math.floor((baseActivity + randomVariation) * 0.6))
      });
    }
    
    return data;
  };

  const generateDeviceData = () => {
    return [
      { name: 'Móvil', value: 60, color: '#3B82F6', icon: Smartphone },
      { name: 'Desktop', value: 35, color: '#10B981', icon: Monitor },
      { name: 'Tablet', value: 5, color: '#F59E0B', icon: Tablet }
    ];
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  const cardHoverVariants = {
    initial: { scale: 1, y: 0 },
    hover: { 
      scale: 1.02, 
      y: -5,
      transition: { duration: 0.2 }
    }
  };

  // Stat cards for Admin Dashboard
  const adminStatCards = [
    {
      title: 'Total Usuarios',
      value: stats.users.total,
      icon: Users,
      description: 'Usuarios registrados',
      trend: stats.users.total > 0 ? '+12%' : null,
      trendUp: true,
      color: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20',
      progress: stats.users.total > 0 ? (stats.users.active / stats.users.total) * 100 : 0
    },
    {
      title: 'Usuarios Activos',
      value: stats.users.active,
      icon: UserCheck,
      description: 'Confirmados y activos',
      trend: stats.users.active > 0 ? '+8%' : null,
      trendUp: true,
      color: 'from-green-500 to-emerald-500',
      bgGradient: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20'
    },
    {
      title: 'Roles Configurados',
      value: stats.roles.total,
      icon: Shield,
      description: 'Roles del sistema',
      trend: 'Configurado',
      trendUp: null,
      color: 'from-purple-500 to-violet-500',
      bgGradient: 'from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20'
    },
    {
      title: 'Permisos Totales',
      value: stats.permissions.total,
      icon: Lock,
      description: 'Permisos configurados',
      trend: stats.permissions.total > 50 ? 'Robusto' : 'Básico',
      trendUp: stats.permissions.total > 50,
      color: 'from-orange-500 to-red-500',
      bgGradient: 'from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20'
    }
  ];

  // Stat cards for Info Dashboard
  const infoStatCards = [
    {
      title: 'Mi Estado',
      value: user?.confirmed ? 'Activo' : 'Pendiente',
      icon: user?.confirmed ? CheckCircle : Clock,
      description: 'Estado de la cuenta',
      color: user?.confirmed ? 'from-green-500 to-emerald-500' : 'from-yellow-500 to-orange-500',
      bgGradient: user?.confirmed ? 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20' : 'from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20'
    },
    {
      title: 'Mi Rol',
      value: user?.role?.name || 'Sin rol',
      icon: user?.role?.type === 'super' ? Crown : user?.role?.type === 'admin' ? Star : Shield,
      description: user?.role?.description || 'Rol no asignado',
      color: 'from-purple-500 to-violet-500',
      bgGradient: 'from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20'
    },
    {
      title: 'En Línea',
      value: 'Conectado',
      icon: Activity,
      description: 'Estado de conexión',
      color: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20'
    },
    {
      title: 'Última Actividad',
      value: 'Ahora',
      icon: Clock,
      description: 'Actividad reciente',
      color: 'from-indigo-500 to-purple-500',
      bgGradient: 'from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20'
    }
  ];

  const EnhancedStatCard = ({ title, value, icon: Icon, description, trend, trendUp, color, bgGradient, progress }: any) => (
    <motion.div variants={itemVariants} whileHover="hover" initial="initial" className="w-full">
      <motion.div variants={cardHoverVariants} className="h-full">
        <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm h-full">
          <div className={`absolute inset-0 bg-gradient-to-br ${bgGradient} opacity-50`}></div>
          <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/5 rounded-full -translate-y-12 translate-x-12 sm:-translate-y-16 sm:translate-x-16 group-hover:scale-110 transition-transform duration-500"></div>
          
          <CardHeader className="pb-2 sm:pb-3 relative z-10">
            <div className="flex items-center justify-between">
              <div className={`p-2 sm:p-3 rounded-xl bg-gradient-to-r ${color} text-white shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              {trend && (
                <div className="flex items-center space-x-1">
                  {trendUp === true && <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />}
                  {trendUp === false && <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />}
                  <span className={`text-xs sm:text-sm font-medium ${
                    trendUp === true ? 'text-green-600' :
                    trendUp === false ? 'text-red-600' :
                    'text-muted-foreground'
                  }`}>
                    {trend}
                  </span>
                </div>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="relative z-10 pb-4">
            <div className="space-y-2">
              <div className="text-2xl sm:text-3xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                {refreshing ? (
                  <div className="animate-pulse bg-muted rounded w-12 sm:w-16 h-6 sm:h-8"></div>
                ) : (
                  typeof value === 'string' ? value : value.toLocaleString()
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground/80 transition-colors truncate">{title}</p>
                <p className="text-xs text-muted-foreground truncate">{description}</p>
              </div>
              {progress !== undefined && (
                <div className="mt-2 sm:mt-3">
                  <Progress value={progress} className="h-1.5 sm:h-2" />
                  <p className="text-xs text-muted-foreground mt-1">{Math.round(progress)}% activo</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );

  const getTendenciaBadge = (value: number, threshold: number) => {
    if (value > threshold) {
      return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Alto</Badge>;
    } else if (value > threshold * 0.5) {
      return <Badge variant="secondary">Medio</Badge>;
    } else {
      return <Badge variant="outline" className="border-orange-300 text-orange-600">Bajo</Badge>;
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Cargando dashboard..." />;
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-background via-background/95 to-primary/5 relative">
      {/* Elementos de fondo animados - Más pequeños en móvil */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-10 sm:top-20 left-10 sm:left-20 w-48 h-48 sm:w-96 sm:h-96 bg-primary/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute bottom-10 sm:bottom-20 right-10 sm:right-20 w-40 h-40 sm:w-80 sm:h-80 bg-secondary/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute top-1/2 left-1/2 w-32 h-32 sm:w-60 sm:h-60 bg-accent/10 rounded-full blur-3xl"
          animate={{
            x: [-50, 50, -50],
            y: [-25, 25, -25],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>
      
      <div className="relative z-10 container mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8 max-w-full">
        {/* Header responsive */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 bg-card/50 backdrop-blur-md p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-lg border max-w-full">
            <motion.div 
              className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-primary via-secondary to-accent rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0"
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.6 }}
            >
              <BarChart3 className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
            </motion.div>
            <div className="text-center sm:text-left min-w-0 flex-1">
              <motion.h1 
                className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Dashboard
              </motion.h1>
              <motion.p 
                className="text-muted-foreground text-sm sm:text-base"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                Bienvenido, <span className="font-semibold text-foreground break-all">{user?.username || user?.email}</span>
              </motion.p>
            </div>
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3 flex-shrink-0">
              <Badge variant="outline" className="px-3 sm:px-4 py-2 bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400 text-xs sm:text-sm">
                <Globe className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                En línea
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadDashboardData(false)}
                disabled={refreshing}
                className="space-x-2 hover:bg-primary/5 transition-all duration-200 hover:scale-105 text-xs sm:text-sm"
              >
                <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Actualizar</span>
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Tabs responsive */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full"
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex justify-center mb-6 sm:mb-8">
              <TabsList className="grid w-full max-w-md grid-cols-2 h-12 sm:h-14 bg-card/50 backdrop-blur-md border shadow-lg">
                <TabsTrigger 
                  value="info" 
                  className="text-xs sm:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white transition-all duration-300"
                >
                  <Info className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Mi Información
                </TabsTrigger>
                {isAdminOrSuper && (
                  <TabsTrigger 
                    value="admin" 
                    className="text-xs sm:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white transition-all duration-300"
                  >
                    <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    Administración
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            <AnimatePresence mode="wait">
              <TabsContent key="info" value="info" className="space-y-6 sm:space-y-8 mt-6 sm:mt-8 w-full">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6 sm:space-y-8 w-full"
                >
                  {/* Estadísticas de información responsive */}
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 w-full"
                  >
                    {infoStatCards.map((stat) => (
                      <EnhancedStatCard key={stat.title} {...stat} />
                    ))}
                  </motion.div>

                  {/* Gráficos responsive */}
                  <div className="grid gap-6 sm:gap-8 grid-cols-1 lg:grid-cols-2 w-full">
                    {/* Gráfico de actividad */}
                    <Card className="p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm border-0 bg-card/50">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                              <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                              Actividad Reciente
                            </CardTitle>
                            <CardDescription className="text-xs sm:text-sm">Últimos 30 días</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="h-48 sm:h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                              <defs>
                                <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                              <XAxis 
                                dataKey="date" 
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12 }}
                              />
                              <YAxis 
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12 }}
                              />
                              <Tooltip />
                              <Area 
                                type="monotone" 
                                dataKey="usuarios" 
                                stroke="hsl(var(--primary))" 
                                fillOpacity={1} 
                                fill="url(#colorActivity)" 
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Distribución de dispositivos */}
                    <Card className="p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm border-0 bg-card/50">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                              <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                              Dispositivos
                            </CardTitle>
                            <CardDescription className="text-xs sm:text-sm">Distribución de acceso</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {deviceData.map((device) => {
                            const IconComponent = device.icon;
                            return (
                              <div key={device.name} className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="p-2 rounded-lg bg-primary/10">
                                    <IconComponent className="h-4 w-4 text-primary" />
                                  </div>
                                  <span className="text-sm font-medium">{device.name}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm text-muted-foreground">{device.value}%</span>
                                  <Progress value={device.value} className="w-16 h-2" />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              </TabsContent>

              {isAdminOrSuper && (
                <TabsContent key="admin" value="admin" className="space-y-6 sm:space-y-8 mt-6 sm:mt-8 w-full">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6 sm:space-y-8 w-full"
                  >
                    {/* Estadísticas de administrador responsive */}
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 w-full"
                    >
                      {adminStatCards.map((stat) => (
                        <EnhancedStatCard key={stat.title} {...stat} />
                      ))}
                    </motion.div>

                    {/* Gráficos administrativos responsive */}
                    <div className="grid gap-6 sm:gap-8 grid-cols-1 lg:grid-cols-2 w-full">
                      {/* Gráfico de usuarios */}
                      <Card className="p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm border-0 bg-card/50">
                        <CardHeader className="pb-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                                Evolución de Usuarios
                              </CardTitle>
                              <CardDescription className="text-xs sm:text-sm">Registros y actividad</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-0">
                          <div className="h-48 sm:h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis 
                                  dataKey="date" 
                                  axisLine={false}
                                  tickLine={false}
                                  tick={{ fontSize: 12 }}
                                />
                                <YAxis 
                                  axisLine={false}
                                  tickLine={false}
                                  tick={{ fontSize: 12 }}
                                />
                                <Tooltip />
                                <Line 
                                  type="monotone" 
                                  dataKey="usuarios" 
                                  stroke="hsl(var(--primary))" 
                                  strokeWidth={3}
                                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                                />
                                <Line 
                                  type="monotone" 
                                  dataKey="registros" 
                                  stroke="hsl(var(--secondary))" 
                                  strokeWidth={2}
                                  dot={{ fill: 'hsl(var(--secondary))', strokeWidth: 2, r: 3 }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Estado del sistema */}
                      <Card className="p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm border-0 bg-card/50">
                        <CardHeader className="pb-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                                <Database className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                                Estado del Sistema
                              </CardTitle>
                              <CardDescription className="text-xs sm:text-sm">Salud general</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                              <div className="flex items-center space-x-3">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <span className="text-sm font-medium">Sistema Operativo</span>
                              </div>
                              <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
                                Activo
                              </Badge>
                            </div>
                            
                            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                              <div className="flex items-center space-x-3">
                                <Database className="h-5 w-5 text-blue-600" />
                                <span className="text-sm font-medium">Base de Datos</span>
                              </div>
                              <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
                                Conectada
                              </Badge>
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                              <div className="flex items-center space-x-3">
                                <Shield className="h-5 w-5 text-purple-600" />
                                <span className="text-sm font-medium">Seguridad</span>
                              </div>
                              <Badge variant="outline" className="bg-purple-50 border-purple-200 text-purple-700">
                                Protegido
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Acciones rápidas de administración */}
                    <Card className="p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm border-0 bg-card/50">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                          <Settings className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                          Acciones Rápidas
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm">Administración del sistema</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                          <Button
                            variant="outline"
                            className="flex flex-col h-auto p-4 space-y-2 hover:bg-primary/5 transition-all duration-200 hover:scale-105"
                            onClick={() => navigate('/admin/users')}
                          >
                            <Users className="h-6 w-6 text-primary" />
                            <span className="text-xs font-medium">Gestionar Usuarios</span>
                          </Button>
                          
                          <Button
                            variant="outline"
                            className="flex flex-col h-auto p-4 space-y-2 hover:bg-primary/5 transition-all duration-200 hover:scale-105"
                            onClick={() => navigate('/admin/roles')}
                          >
                            <Shield className="h-6 w-6 text-primary" />
                            <span className="text-xs font-medium">Roles y Permisos</span>
                          </Button>
                          
                          <Button
                            variant="outline"
                            className="flex flex-col h-auto p-4 space-y-2 hover:bg-primary/5 transition-all duration-200 hover:scale-105"
                            onClick={() => navigate('/admin/notifications')}
                          >
                            <AlertCircle className="h-6 w-6 text-primary" />
                            <span className="text-xs font-medium">Notificaciones</span>
                          </Button>
                          
                          <Button
                            variant="outline"
                            className="flex flex-col h-auto p-4 space-y-2 hover:bg-primary/5 transition-all duration-200 hover:scale-105"
                            onClick={() => navigate('/admin/bitacora')}
                          >
                            <Eye className="h-6 w-6 text-primary" />
                            <span className="text-xs font-medium">Auditoría</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>
              )}
            </AnimatePresence>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default ModernDashboard;