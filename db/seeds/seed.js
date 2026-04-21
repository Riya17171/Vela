import fs from 'fs'

async function seedProducts() {
    console.log('Fetching dummy products...')
    try {
        const response = await fetch('https://dummyjson.com/products?limit=24')
        const data = await response.json()

        let sql = 'INSERT INTO products (title, description, price, category, image_url, rating, rating_count, is_featured) VALUES\n'

        const values = data.products.map(p => {
            const title = p.title.replace(/'/g, "''")
            const desc = p.description.replace(/'/g, "''")
            const cat = p.category.replace('-', ' ').replace(/'/g, "''")
            const img = (p.images[0] || p.thumbnail).replace(/'/g, "''")
            const ratingCount = p.reviews?.length || Math.floor(Math.random() * 100) + 10
            const isFeatured = p.rating > 4.5 && p.id % 2 === 0

            return `('${title}', '${desc}', ${p.price}, '${cat}', '${img}', ${p.rating}, ${ratingCount}, ${isFeatured})`
        })

        sql += values.join(',\n') + ';'

        fs.writeFileSync('seed_products.sql', sql)
        console.log('Created seed_products.sql!')

    } catch (err) {
        console.error('Failed to create seed:', err)
    }
}

seedProducts()
