const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const axios = require('axios');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.static(__dirname));

// PostgreSQL connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Initialize database
async function initDatabase() {
    try {
        // Scraping runs table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS scraping_runs (
                id SERIAL PRIMARY KEY,
                run_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                product_count INTEGER DEFAULT 0,
                pages_scraped INTEGER DEFAULT 0,
                time_taken INTEGER DEFAULT 0
            )
        `);

        // Products table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS flash_sale_products (
                id SERIAL PRIMARY KEY,
                run_id INTEGER REFERENCES scraping_runs(id),
                scrape_date TIMESTAMP,
                item_id VARCHAR(255),
                sku_id VARCHAR(255),
                title TEXT,
                original_price VARCHAR(100),
                discount_price VARCHAR(100),
                discount_percentage VARCHAR(50),
                saved_amount VARCHAR(100),
                currency VARCHAR(20),
                rating VARCHAR(50),
                reviews VARCHAR(50),
                total_sales VARCHAR(50),
                items_sold VARCHAR(50),
                stock_remaining VARCHAR(50),
                stock_total VARCHAR(50),
                free_shipping BOOLEAN,
                is_dazmall BOOLEAN,
                seller_id VARCHAR(255),
                category_id VARCHAR(255),
                image_url TEXT,
                product_url TEXT,
                sale_start TIMESTAMP,
                sale_end TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Migrate existing table columns to larger sizes
        try {
            await pool.query(`
                ALTER TABLE flash_sale_products 
                ALTER COLUMN original_price TYPE VARCHAR(100),
                ALTER COLUMN discount_price TYPE VARCHAR(100),
                ALTER COLUMN discount_percentage TYPE VARCHAR(50),
                ALTER COLUMN saved_amount TYPE VARCHAR(100),
                ALTER COLUMN currency TYPE VARCHAR(20),
                ALTER COLUMN rating TYPE VARCHAR(50),
                ALTER COLUMN reviews TYPE VARCHAR(50),
                ALTER COLUMN total_sales TYPE VARCHAR(50),
                ALTER COLUMN items_sold TYPE VARCHAR(50),
                ALTER COLUMN stock_remaining TYPE VARCHAR(50),
                ALTER COLUMN stock_total TYPE VARCHAR(50)
            `);
            console.log('✓ Table columns updated');
        } catch (err) {
            // Ignore if columns already correct size
            if (!err.message.includes('already exists')) {
                console.log('Column migration skipped (likely already correct)');
            }
        }

        console.log('✓ Database initialized');
    } catch (error) {
        console.error('Database initialization error:', error);
    }
}

initDatabase();

// Parse cookies
function parseCookies(cookieString) {
    const cookies = {};
    cookieString.replace(/\n/g, '').trim().split(';').forEach(cookie => {
        const parts = cookie.trim().split('=');
        if (parts.length >= 2) {
            cookies[parts[0].trim()] = parts.slice(1).join('=').trim();
        }
    });
    return cookies;
}

// Generate signature
function generateSign(token, timestamp, appKey, data) {
    const tokenPart = token.includes('_') ? token.split('_')[0] : token;
    const signStr = `${tokenPart}&${timestamp}&${appKey}&${data}`;
    return crypto.createHash('md5').update(signStr).digest('hex');
}

// Convert timestamp
function convertTimestamp(timestamp) {
    try {
        if (timestamp) {
            const date = new Date(parseInt(timestamp));
            return date.toISOString();
        }
        return null;
    } catch {
        return null;
    }
}

// Scraper function
async function scrapeDaraz(cookieString) {
    const startTime = Date.now();
    const cookies = parseCookies(cookieString);
    
    // Validate essential cookies
    const essential = ['_m_h5_tk', '_m_h5_tk_enc', 'lzd_sid'];
    for (const key of essential) {
        if (!cookies[key]) {
            throw new Error(`Missing essential cookie: ${key}`);
        }
    }

    const baseUrl = 'https://acs-m.daraz.pk/h5/mtop.relationrecommend.lazadarecommend.recommend/1.0/';
    const appKey = '24677475';
    
    const headers = {
        'accept': 'application/json',
        'accept-language': 'en-US,en;q=0.9',
        'content-type': 'application/x-www-form-urlencoded',
        'origin': 'https://pages.daraz.pk',
        'referer': 'https://pages.daraz.pk/',
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'x-i18n-language': 'en',
        'x-i18n-regionid': 'PK'
    };

    let allItems = [];
    let pageNo = 1;
    let streamId = null;
    const maxPages = 20;

    console.log(`🚀 Starting scrape - Max pages: ${maxPages}`);

    // Build request
    const buildRequest = (page, stream) => {
        const timestamp = Date.now().toString();
        const paramsDict = {
            type: 'pclp',
            isbackup: true,
            backupParams: 'regionId,language,type,pageNo,buType,sellerId,bizCategoryId,childCampaignId',
            _input_charset: 'UTF-8',
            _output_charset: 'UTF-8',
            appVersion: '1',
            flashsaleVersion: 3,
            language: 'en',
            regionId: 'PK',
            platform: 'pc',
            pageNo: page
        };

        if (stream) paramsDict.streamId = stream;

        const dataObj = {
            appId: '41711',
            params: JSON.stringify(paramsDict)
        };

        const dataStr = JSON.stringify(dataObj);
        const token = cookies['_m_h5_tk'];
        const sign = generateSign(token, timestamp, appKey, dataStr);

        const params = new URLSearchParams({
            jsv: '2.7.2',
            appKey: appKey,
            t: timestamp,
            sign: sign,
            api: 'mtop.relationrecommend.LazadaRecommend.recommend',
            v: '1.0',
            type: 'originaljson',
            isSec: '1',
            AntiCreep: 'true',
            timeout: '20000',
            dataType: 'json',
            sessionOption: 'AutoLoginOnly',
            'x-i18n-language': 'en',
            'x-i18n-regionID': 'PK',
            isIcmsMtop: 'true',
            parallel: 'true',
            data: dataStr
        });

        return `${baseUrl}?${params.toString()}`;
    };

    // Fetch page
    const fetchPage = async (page, stream) => {
        try {
            const url = buildRequest(page, stream);
            const response = await axios.get(url, { 
                headers, 
                timeout: 20000,
                // Convert cookies object to cookie string
                headers: {
                    ...headers,
                    'cookie': Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ')
                }
            });

            const data = response.data;
            const ret = data.ret?.[0] || '';

            if (!ret.includes('SUCCESS')) {
                throw new Error(`API Error: ${ret}`);
            }

            return data;
        } catch (error) {
            throw new Error(`Request failed: ${error.message}`);
        }
    };

    // First page
    console.log(`📄 Fetching page ${pageNo}...`);
    const firstData = await fetchPage(pageNo, null);
    const firstItems = firstData?.data?.result?.[0]?.data?.items || [];
    allItems = allItems.concat(firstItems);
    console.log(`✓ Page ${pageNo}: ${firstItems.length} items (Total: ${allItems.length})`);

    const endPage = firstData?.data?.result?.[0]?.endPage || false;
    if (endPage) {
        console.log('✓ Only one page available');
    } else {
        streamId = firstData?.data?.result?.[0]?.streamId;
        
        if (streamId) {
            // Fetch remaining pages
            while (pageNo < maxPages) {
                pageNo++;
                await new Promise(resolve => setTimeout(resolve, 1500)); // Delay

                console.log(`📄 Fetching page ${pageNo}...`);
                const pageData = await fetchPage(pageNo, streamId);
                const items = pageData?.data?.result?.[0]?.data?.items || [];

                if (items.length === 0) {
                    console.log('⚠️  No more items');
                    break;
                }

                allItems = allItems.concat(items);
                console.log(`✓ Page ${pageNo}: ${items.length} items (Total: ${allItems.length})`);

                const isEnd = pageData?.data?.result?.[0]?.endPage || false;
                if (isEnd) {
                    console.log('✓ Reached end');
                    break;
                }

                const newStreamId = pageData?.data?.result?.[0]?.streamId;
                if (newStreamId && newStreamId !== streamId) {
                    streamId = newStreamId;
                }
            }
        }
    }

    const endTime = Date.now();
    const timeTaken = Math.round((endTime - startTime) / 1000);

    console.log(`✅ Scraping complete! ${allItems.length} products in ${timeTaken}s`);

    return {
        items: allItems,
        pages_scraped: pageNo,
        time_taken: timeTaken
    };
}

// Extract product info
function extractProducts(items, runId) {
    const scrapeDate = new Date().toISOString();
    return items.map(item => ({
        run_id: runId,
        scrape_date: scrapeDate,
        item_id: item.itemId || '',
        sku_id: item.skuId || '',
        title: item.itemTitle || '',
        original_price: item.itemPrice?.itemPrice || '',
        discount_price: item.itemPrice?.itemDiscountPrice || '',
        discount_percentage: item.itemPrice?.itemDiscount || '',
        saved_amount: item.itemPrice?.saved || '',
        currency: item.itemPrice?.currency || '',
        rating: item.itemMetric?.itemRating || '',
        reviews: item.itemMetric?.itemReviews || '',
        total_sales: item.itemSaleVolume?.totalVolume || '',
        items_sold: item.itemSaleVolume?.itemSoldCnt || '',
        stock_remaining: item.itemSaleVolume?.itemCurrentStock || '',
        stock_total: item.itemSaleVolume?.itemTotalStock || '',
        free_shipping: item.itemBenefit?.freeShipping || false,
        is_dazmall: (item.buType || []).includes('DazMall'),
        seller_id: item.seller?.sellerId || '',
        category_id: item.itemCategory?.cateLeafId || '',
        image_url: item.itemImg || '',
        product_url: item.itemUrl ? `https:${item.itemUrl}` : '',
        sale_start: convertTimestamp(item.effectTime?.startTime),
        sale_end: convertTimestamp(item.effectTime?.endTime)
    }));
}

// API: Run scraper
app.post('/api/scrape', async (req, res) => {
    const { cookies } = req.body;

    if (!cookies) {
        return res.status(400).json({ error: 'No cookies provided' });
    }

    try {
        console.log('🚀 Starting scrape...');
        const result = await scrapeDaraz(cookies);
        
        // Create scraping run
        const runResult = await pool.query(
            'INSERT INTO scraping_runs (product_count, pages_scraped, time_taken) VALUES ($1, $2, $3) RETURNING id',
            [result.items.length, result.pages_scraped, result.time_taken]
        );
        const runId = runResult.rows[0].id;

        // Extract and save products
        const products = extractProducts(result.items, runId);
        
        for (const product of products) {
            await pool.query(`
                INSERT INTO flash_sale_products (
                    run_id, scrape_date, item_id, sku_id, title, original_price, discount_price,
                    discount_percentage, saved_amount, currency, rating, reviews, total_sales,
                    items_sold, stock_remaining, stock_total, free_shipping, is_dazmall,
                    seller_id, category_id, image_url, product_url, sale_start, sale_end
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
            `, [
                product.run_id, product.scrape_date, product.item_id, product.sku_id, product.title,
                product.original_price, product.discount_price, product.discount_percentage,
                product.saved_amount, product.currency, product.rating, product.reviews,
                product.total_sales, product.items_sold, product.stock_remaining, product.stock_total,
                product.free_shipping, product.is_dazmall, product.seller_id, product.category_id,
                product.image_url, product.product_url, product.sale_start, product.sale_end
            ]);
        }

        console.log(`✅ Saved ${products.length} products to database`);

        res.json({
            success: true,
            total_products: products.length,
            pages_scraped: result.pages_scraped,
            time_taken: result.time_taken,
            run_id: runId
        });

    } catch (error) {
        console.error('Scrape error:', error);
        res.status(500).json({ error: error.message });
    }
});

// API: Get history
app.get('/api/history', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, run_date, product_count, pages_scraped, time_taken FROM scraping_runs ORDER BY run_date DESC LIMIT 50'
        );
        res.json({ runs: result.rows });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API: Get analytics
app.get('/api/analytics', async (req, res) => {
    try {
        const stats = await pool.query(`
            SELECT 
                COUNT(*) as total_products,
                AVG(NULLIF(REGEXP_REPLACE(discount_price, '[^0-9.]', '', 'g'), '')::NUMERIC) as avg_price,
                AVG(NULLIF(REGEXP_REPLACE(discount_percentage, '[^0-9.]', '', 'g'), '')::NUMERIC) as avg_discount
            FROM flash_sale_products
            WHERE discount_price IS NOT NULL AND discount_price != ''
        `);

        const runs = await pool.query('SELECT COUNT(*) as total FROM scraping_runs');

        const topSellers = await pool.query(`
            SELECT title, total_sales, discount_price, discount_percentage
            FROM flash_sale_products
            WHERE total_sales IS NOT NULL 
            AND total_sales != ''
            AND REGEXP_REPLACE(total_sales, '[^0-9]', '', 'g') != ''
            ORDER BY NULLIF(REGEXP_REPLACE(total_sales, '[^0-9]', '', 'g'), '')::INTEGER DESC
            LIMIT 10
        `);

        res.json({
            total_products: parseInt(stats.rows[0].total_products) || 0,
            avg_price: parseFloat(stats.rows[0].avg_price) || 0,
            avg_discount: parseFloat(stats.rows[0].avg_discount) || 0,
            total_runs: parseInt(runs.rows[0].total) || 0,
            top_sellers: topSellers.rows
        });
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ 
            error: error.message,
            total_products: 0,
            avg_price: 0,
            avg_discount: 0,
            total_runs: 0,
            top_sellers: []
        });
    }
});

// API: Delete scraping run and its products
app.delete('/api/run/:runId', async (req, res) => {
    try {
        const runId = req.params.runId;
        
        // First delete all products for this run
        const deleteProducts = await pool.query(
            'DELETE FROM flash_sale_products WHERE run_id = $1',
            [runId]
        );
        
        // Then delete the run itself
        const deleteRun = await pool.query(
            'DELETE FROM scraping_runs WHERE id = $1 RETURNING *',
            [runId]
        );

        if (deleteRun.rows.length === 0) {
            return res.status(404).json({ error: 'Run not found' });
        }

        console.log(`🗑️  Deleted run ${runId} and ${deleteProducts.rowCount} products`);

        res.json({ 
            success: true, 
            message: `Deleted run and ${deleteProducts.rowCount} products`,
            products_deleted: deleteProducts.rowCount
        });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: error.message });
    }
});

// API: Download CSV for specific run
app.get('/api/download/run/:runId', async (req, res) => {
    try {
        const runId = req.params.runId;
        const products = await pool.query(
            'SELECT * FROM flash_sale_products WHERE run_id = $1 ORDER BY id',
            [runId]
        );

        if (products.rows.length === 0) {
            return res.status(404).send('No data found for this run');
        }

        const csv = generateCSV(products.rows);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="flash_sale_run_${runId}.csv"`);
        res.send(csv);
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).send('Error generating CSV');
    }
});

// API: Download latest CSV
app.get('/api/download/latest', async (req, res) => {
    try {
        const latestRun = await pool.query(
            'SELECT id FROM scraping_runs ORDER BY run_date DESC LIMIT 1'
        );

        if (latestRun.rows.length === 0) {
            return res.status(404).send('No data available');
        }

        const runId = latestRun.rows[0].id;
        const products = await pool.query(
            'SELECT * FROM flash_sale_products WHERE run_id = $1 ORDER BY id',
            [runId]
        );

        const csv = generateCSV(products.rows);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="flash_sale_${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csv);
    } catch (error) {
        res.status(500).send('Error generating CSV');
    }
});

// API: Download master CSV
app.get('/api/download/master', async (req, res) => {
    try {
        const products = await pool.query('SELECT * FROM flash_sale_products ORDER BY scrape_date DESC');
        const csv = generateCSV(products.rows);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="master_flash_sale.csv"');
        res.send(csv);
    } catch (error) {
        res.status(500).send('Error generating CSV');
    }
});

// Generate CSV
function generateCSV(rows) {
    if (rows.length === 0) return '';
    
    const headers = Object.keys(rows[0]).join(',');
    const data = rows.map(row => {
        return Object.values(row).map(val => {
            if (val === null) return '';
            const str = String(val).replace(/"/g, '""');
            return `"${str}"`;
        }).join(',');
    }).join('\n');
    
    return `${headers}\n${data}`;
}

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'scraper.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Daraz Scraper running on port ${PORT}`);
});
