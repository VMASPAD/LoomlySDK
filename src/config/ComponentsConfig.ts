import type { ComponentType } from 'react';
import Prism from '@/components/Backgrounds/Prism/Prism';
import Waves from '@/components/Backgrounds/Waves/Waves';

// Interfaz para definir componentes React
export interface ComponentConfig {
    name: string;
    displayName: string;
    category: 'backgrounds' | 'buttons' | 'text' | 'animations' | 'ui' | 'misc';
    component: ComponentType<any>;
    importPath: string;
    description?: string;
    defaultProps?: Record<string, any>;
    icon?: string;
    size?: {
        width: number;
        height: number;
    };
    tags?: string[];
}

// Configuración centralizada de todos los componentes React
export const REACT_COMPONENTS_CONFIG: Record<string, ComponentConfig> = {
    // Backgrounds
    Prism: {
        name: 'Prism',
        displayName: '🔮 Prism Background',
        category: 'backgrounds',
        component: Prism,
        importPath: '@/components/Backgrounds/Prism/Prism',
        description: 'Animated prism background effect',
        defaultProps: {},
        size: { width: 300, height: 200 },
        tags: ['animated', 'colorful', 'background']
    },
    
    Waves: {
        name: 'Waves',
        displayName: '🌊 Waves Background', 
        category: 'backgrounds',
        component: Waves,
        importPath: '@/components/Backgrounds/Waves/Waves',
        description: 'Animated waves background effect',
        defaultProps: {},
        size: { width: 400, height: 250 },
        tags: ['animated', 'fluid', 'background']
    },

    // Text Animations (configurar cuando estén disponibles)
    AuroraText: {
        name: 'AuroraText',
        displayName: '✨ Aurora Text',
        category: 'text',
        component: null as any, // Placeholder hasta que se implemente
        importPath: '@/components/TextAnimations/AuroraText',
        description: 'Text with aurora effect animation',
        defaultProps: { text: 'Aurora Text' },
        size: { width: 200, height: 50 },
        tags: ['text', 'animated', 'glow']
    },

    AnimatedGradientText: {
        name: 'AnimatedGradientText',
        displayName: '🌈 Gradient Text',
        category: 'text', 
        component: null as any,
        importPath: '@/components/TextAnimations/AnimatedGradientText',
        description: 'Text with animated gradient colors',
        defaultProps: { text: 'Gradient Text' },
        size: { width: 180, height: 40 },
        tags: ['text', 'animated', 'gradient']
    },

    SparklesText: {
        name: 'SparklesText',
        displayName: '✨ Sparkles Text',
        category: 'text',
        component: null as any,
        importPath: '@/components/TextAnimations/SparklesText', 
        description: 'Text with sparkles animation effect',
        defaultProps: { text: 'Sparkles Text' },
        size: { width: 200, height: 45 },
        tags: ['text', 'animated', 'sparkles']
    },

    // Buttons (configurar cuando estén disponibles)
    RippleButton: {
        name: 'RippleButton',
        displayName: '🌊 Ripple Button',
        category: 'buttons',
        component: null as any,
        importPath: '@/components/Buttons/RippleButton',
        description: 'Button with ripple click effect',
        defaultProps: { children: 'Click me' },
        size: { width: 120, height: 40 },
        tags: ['button', 'animated', 'ripple']
    },

    ShimmerButton: {
        name: 'ShimmerButton', 
        displayName: '✨ Shimmer Button',
        category: 'buttons',
        component: null as any,
        importPath: '@/components/Buttons/ShimmerButton',
        description: 'Button with shimmer hover effect',
        defaultProps: { children: 'Shimmer' },
        size: { width: 130, height: 40 },
        tags: ['button', 'animated', 'shimmer']
    },

    // Animations
    BlurFade: {
        name: 'BlurFade',
        displayName: '🌫️ Blur Fade',
        category: 'animations',
        component: null as any,
        importPath: '@/components/Animations/BlurFade', 
        description: 'Blur fade in/out animation wrapper',
        defaultProps: {},
        size: { width: 200, height: 100 },
        tags: ['animation', 'blur', 'fade']
    }
};

/**
 * Obtener configuración de un componente por nombre
 */
export const getComponentConfig = (name: string): ComponentConfig | undefined => {
    return REACT_COMPONENTS_CONFIG[name];
};

/**
 * Obtener todos los componentes disponibles
 */
export const getAvailableComponents = (): ComponentConfig[] => {
    return Object.values(REACT_COMPONENTS_CONFIG).filter(config => config.component !== null);
};

/**
 * Obtener componentes por categoría  
 */
export const getComponentsByCategory = (category: ComponentConfig['category']): ComponentConfig[] => {
    return Object.values(REACT_COMPONENTS_CONFIG)
        .filter(config => config.category === category && config.component !== null);
};

/**
 * Obtener ruta de importación de un componente
 */
export const getComponentImportPath = (componentName: string): string => {
    const config = getComponentConfig(componentName);
    return config?.importPath || `@/components/${componentName}`;
};

/**
 * Validar si un componente existe y está disponible
 */
export const isComponentAvailable = (name: string): boolean => {
    const config = getComponentConfig(name);
    return !!(config && config.component !== null);
};

/**
 * Obtener props por defecto de un componente
 */
export const getDefaultProps = (componentName: string): Record<string, any> => {
    const config = getComponentConfig(componentName);
    return config?.defaultProps || {};
};

/**
 * Obtener tamaño por defecto de un componente
 */
export const getDefaultSize = (componentName: string): { width: number; height: number } => {
    const config = getComponentConfig(componentName);
    return config?.size || { width: 200, height: 200 };
};

export default REACT_COMPONENTS_CONFIG;