export interface ListingFormData {
    category: string;
    subcategory: string;
    title: string;
    description: string;
    photos: string[];
    location: {
        lat: number;
        lng: number;
    } | null;
    address: string;
    price_per_day: number | '';
    price_per_week: number | '';
    price_per_month: number | '';
}
declare const CreateListingPage: () => import("react/jsx-runtime").JSX.Element;
export default CreateListingPage;
