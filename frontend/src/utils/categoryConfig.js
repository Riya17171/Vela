export const SIZES = {
    clothing: ['XS', 'S', 'M', 'L', 'XL'],
    shoes: ['38', '39', '40', '41', '42', '43', '44'],
}

export const CATEGORY_CONFIG = {
    'womens-rtw': {
        hasSizes: true,
        sizeType: 'clothing',
        hasColors: true,
        hasVolume: false,
        addLabel: 'Add to Bag',
    },
    'mens-rtw': {
        hasSizes: true,
        sizeType: 'clothing',
        hasColors: true,
        hasVolume: false,
        addLabel: 'Add to Bag',
    },
    'handbags': {
        hasSizes: false,
        hasColors: true,
        colorLabel: 'Leather',
        hasVolume: false,
        addLabel: 'Add to Bag',
    },
    'accessories': {
        hasSizes: false,
        hasColors: true,
        colorLabel: 'Finish',
        hasVolume: false,
        addLabel: 'Add to Bag',
    },
    'fragrances': {
        hasSizes: false,
        hasColors: false,
        hasVolume: true,
        addLabel: 'Add to Bag',
    },
    'footwear': {
        hasSizes: true,
        sizeType: 'shoes',
        hasColors: true,
        hasVolume: false,
        addLabel: 'Add to Bag',
    },
}

export function getCategoryConfig(category) {
    return CATEGORY_CONFIG[category] || {
        hasSizes: false,
        hasColors: false,
        hasVolume: false,
        addLabel: 'Add to Bag',
    }
}
