const http = require('http');

const PORT = 5000;
const HOST = 'localhost';

function request(path, method, body = null) {
    return new Promise((resolve, reject) => {
        const payload = body ? JSON.stringify(body) : '';
        const options = {
            hostname: HOST,
            port: PORT,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    resolve({
                        statusCode: res.statusCode,
                        body: data ? JSON.parse(data) : {}
                    });
                } catch (e) {
                    resolve({
                        statusCode: res.statusCode,
                        body: data
                    });
                }
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        if (body) {
            req.write(payload);
        }
        req.end();
    });
}

async function runTests() {
    console.log('--- STARTING BACKEND API VERIFICATION TESTS ---');
    const uniqueEmail = `test_${Date.now()}@example.com`;
    let testUserId = null;
    let testMovieId = null;
    let watchlistItemId = null;

    try {
        // 1. Test Register
        console.log('1. Testing User Registration...');
        const uniqueUsername = `testuser_${Date.now()}`;
        const regRes = await request('/api/auth/register', 'POST', {
            username: uniqueUsername,
            email: uniqueEmail,
            password: 'password123'
        });
        
        if (regRes.statusCode === 201 && regRes.body.success) {
            console.log('   ✓ Registration Succeeded.');
            testUserId = regRes.body.user.id;
        } else {
            throw new Error(`Registration Failed: ${JSON.stringify(regRes.body)}`);
        }

        // 2. Test Login
        console.log('2. Testing User Login...');
        const loginRes = await request('/api/auth/login', 'POST', {
            email: uniqueEmail,
            password: 'password123'
        });
        
        if (loginRes.statusCode === 200 && loginRes.body.success) {
            console.log('   ✓ Login Succeeded.');
        } else {
            throw new Error(`Login Failed: ${JSON.stringify(loginRes.body)}`);
        }

        // 3. Test Add Movie
        console.log('3. Testing Movie Creation...');
        const movieRes = await request('/api/movies', 'POST', {
            title: 'Test Sci-Fi Movie',
            type: 'movie',
            year: 2026,
            rating: 8.5,
            genres: 'Sci-Fi, Action',
            synopsis: 'A test sci-fi movie created by automated API tests.'
        });

        if (movieRes.statusCode === 201 && movieRes.body.success) {
            console.log('   ✓ Movie Creation Succeeded.');
            testMovieId = movieRes.body.movie.id;
        } else {
            throw new Error(`Movie Creation Failed: ${JSON.stringify(movieRes.body)}`);
        }

        // 4. Test Add Review
        console.log('4. Testing Review Submission...');
        const reviewRes = await request('/api/reviews', 'POST', {
            userId: testUserId,
            movieId: testMovieId,
            rating: 9.0,
            title: 'Great Test Movie',
            content: 'Highly recommended. Automated review test is successful.',
            metrics: { overall: 9, story: 9, characters: 9, visuals: 9, sound: 9 }
        });

        if (reviewRes.statusCode === 201 && reviewRes.body.success) {
            console.log('   ✓ Review Submission Succeeded.');
        } else {
            throw new Error(`Review Submission Failed: ${JSON.stringify(reviewRes.body)}`);
        }

        // 5. Test Add to Watchlist
        console.log('5. Testing Add to Watchlist...');
        const watchRes = await request('/api/watchlist', 'POST', {
            userId: testUserId,
            itemId: testMovieId,
            itemType: 'movie'
        });

        if (watchRes.statusCode === 201 && watchRes.body.success) {
            console.log('   ✓ Add to Watchlist Succeeded.');
            watchlistItemId = watchRes.body.entry.id;
        } else {
            throw new Error(`Add to Watchlist Failed: ${JSON.stringify(watchRes.body)}`);
        }

        // 6. Test Delete from Watchlist
        console.log('6. Testing Delete from Watchlist...');
        const deleteRes = await request('/api/watchlist', 'DELETE', {
            id: watchlistItemId
        });

        if (deleteRes.statusCode === 200 && deleteRes.body.success) {
            console.log('   ✓ Delete from Watchlist Succeeded.');
        } else {
            throw new Error(`Delete from Watchlist Failed: ${JSON.stringify(deleteRes.body)}`);
        }

        // 7. Verify dynamic aggregated data
        console.log('7. Testing dynamic aggregated /data.json endpoint...');
        const dataRes = await request('/data.json', 'GET');
        if (dataRes.statusCode === 200 && dataRes.body.movies) {
            const hasTestMovie = dataRes.body.movies.some(m => m.id === testMovieId);
            if (hasTestMovie) {
                console.log('   ✓ Aggregated data correctly contains newly added movie.');
            } else {
                throw new Error('Aggregated data does not contain test movie.');
            }
        } else {
            throw new Error(`Aggregated endpoint failed: ${JSON.stringify(dataRes.body)}`);
        }

        console.log('\n=== ALL API TESTS PASSED SUCCESSFULLY ===');
    } catch (e) {
        console.error('\n❌ API VERIFICATION TEST FAILED:', e.message);
    }
}

runTests();
