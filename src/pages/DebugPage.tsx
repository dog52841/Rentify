import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/Button';

const DebugPage = () => {
    const [testResults, setTestResults] = useState<any>({});
    const [loading, setLoading] = useState(false);

    const runTests = async () => {
        setLoading(true);
        const results: any = {};

        try {
            // Test 1: Check if we can connect to Supabase
            console.log('Testing Supabase connection...');
            const { data: testData, error: testError } = await supabase
                .from('profiles')
                .select('count')
                .limit(1);

            results.connection = {
                success: !testError,
                error: testError?.message || null
            };

            // Test 2: Check listings table
            console.log('Testing listings table...');
            const { data: listingsData, error: listingsError } = await supabase
                .from('listings')
                .select('*')
                .limit(5);

            results.listings = {
                success: !listingsError,
                error: listingsError?.message || null,
                count: listingsData?.length || 0,
                sample: listingsData?.[0] || null
            };

            // Test 3: Check profiles table
            console.log('Testing profiles table...');
            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('*')
                .limit(5);

            results.profiles = {
                success: !profilesError,
                error: profilesError?.message || null,
                count: profilesData?.length || 0,
                sample: profilesData?.[0] || null
            };

            // Test 4: Check bookings table
            console.log('Testing bookings table...');
            const { data: bookingsData, error: bookingsError } = await supabase
                .from('bookings')
                .select('*')
                .limit(5);

            results.bookings = {
                success: !bookingsError,
                error: bookingsError?.message || null,
                count: bookingsData?.length || 0,
                sample: bookingsData?.[0] || null
            };

            // Test 5: Check reviews table
            console.log('Testing reviews table...');
            const { data: reviewsData, error: reviewsError } = await supabase
                .from('reviews')
                .select('*')
                .limit(5);

            results.reviews = {
                success: !reviewsError,
                error: reviewsError?.message || null,
                count: reviewsData?.length || 0,
                sample: reviewsData?.[0] || null
            };

        } catch (error: any) {
            console.error('Debug test error:', error);
            results.generalError = error.message;
        }

        setTestResults(results);
        setLoading(false);
    };

    useEffect(() => {
        runTests();
    }, []);

    return (
        <div className="container mx-auto py-8 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Database Debug Page</h1>
                <Button onClick={runTests} disabled={loading}>
                    {loading ? 'Running Tests...' : 'Run Tests Again'}
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(testResults).map(([testName, result]: [string, any]) => (
                    <Card key={testName} className={result.success ? 'border-green-200' : 'border-red-200'}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span className={`w-3 h-3 rounded-full ${result.success ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                {testName.charAt(0).toUpperCase() + testName.slice(1)} Test
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {result.success ? (
                                <div className="space-y-2">
                                    <p className="text-green-600 font-medium">✓ Success</p>
                                    {result.count !== undefined && (
                                        <p className="text-sm text-muted-foreground">
                                            Found {result.count} records
                                        </p>
                                    )}
                                    {result.sample && (
                                        <details className="mt-2">
                                            <summary className="cursor-pointer text-sm text-muted-foreground">
                                                Sample Data
                                            </summary>
                                            <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                                                {JSON.stringify(result.sample, null, 2)}
                                            </pre>
                                        </details>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-red-600 font-medium">✗ Failed</p>
                                    <p className="text-sm text-muted-foreground">{result.error}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {testResults.generalError && (
                <Card className="border-red-200">
                    <CardHeader>
                        <CardTitle className="text-red-600">General Error</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-red-600">{testResults.generalError}</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default DebugPage; 