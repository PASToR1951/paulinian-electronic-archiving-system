import React, { useState, ChangeEvent, useEffect, useMemo, useCallback } from 'react';
import type { NextPage } from 'next';
// Assuming these paths are correct relative to your project structure
// If using Shadcn/ui, these components should be generated in your project
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail, Linkedin, Edit, Save, XCircle, Link as LinkIcon, ChevronDown, ChevronUp, Tag } from 'lucide-react';
import { cn } from '@/lib/utils'; // Utility for combining class names
import { motion, AnimatePresence } from 'framer-motion'; // For animations
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Import Dropdown components

// Define Publication Category Type
type PublicationCategory = 'Thesis' | 'Dissertation' | 'Confluence' | 'Synergy';

// Define the Publication data structure
interface Publication {
    id: string; // Unique identifier for each publication
    title: string;
    category: PublicationCategory;
    year: number;
    link?: string | null; // Optional link to the publication
    tags: string[];
}

// Define the Author data structure including publications
interface Author {
    author_id: string;
    full_name: string;
    affiliation: string;
    department: string;
    year_of_graduation?: number | null | string; // Allow string for input flexibility, parse on save
    email?: string | null;
    linkedin?: string | null;
    orcid_id?: string | null;
    bio?: string | null;
    profile_picture?: string | null; // URL or path to image
    publications: Publication[]; // Array of publications
    created_at: string; // ISO Date string
    updated_at: string; // ISO Date string
}

// Sample Author Data with Publications (Placeholder)
// In a real app, this would likely come from an API
const sampleAuthor: Author = {
    author_id: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    full_name: "Dr. Evelyn Reed",
    affiliation: "Starlight University",
    department: "Astrophysics",
    year_of_graduation: 2010,
    email: "e.reed@starlight.edu",
    linkedin: "https://linkedin.com/in/evelynreed",
    orcid_id: "0000-0001-2345-6789",
    bio: "Dr. Evelyn Reed is a leading researcher in the field of exoplanetary science. Her work focuses on the atmospheric composition of distant worlds and the search for habitable environments beyond our solar system. She is passionate about science communication and mentoring the next generation of astronomers. Her recent publications explore novel techniques for detecting biosignatures in exoplanet atmospheres.",
    profile_picture: undefined, // Example: 'https://placehold.co/100x100/E0E0E0/555555?text=ER' or actual URL
    publications: [
        { id: "pub1", title: "Atmospheric Characterization of GJ 1214b", category: "Synergy", year: 2015, link: "https://example.com/Synergy1", tags: ["Exoplanets", "Atmosphere", "Spectroscopy"] },
        { id: "pub2", title: "Searching for Biosignatures on TRAPPIST-1e", category: "Synergy", year: 2018, tags: ["Exoplanets", "Biosignatures", "Habitable Zones"] },
        { id: "pub3", title: "Novel Techniques in Exoplanet Detection", category: "Confluence", year: 2019, link: "https://example.com/conf1", tags: ["Exoplanets", "Telescopes", "Instrumentation", "Data Analysis", "Machine Learning", "Statistics", "Bayesian Inference"] }, // More than 5 tags
        { id: "pub4", title: "The Evolution of Planetary Atmospheres", category: "Dissertation", year: 2010, tags: ["Planetary Science", "Atmospheric Evolution", "Modeling"] },
        { id: "pub5", title: "Early Universe Cosmology Models", category: "Thesis", year: 2006, tags: ["Cosmology", "Early Universe", "Inflation"] },
        { id: "pub6", title: "High-Contrast Imaging for Exoplanet Discovery", category: "Confluence", year: 2021, tags: ["Exoplanets", "Imaging", "Adaptive Optics"] },
        { id: "pub7", title: "Galaxy Formation and Evolution", category: "Synergy", year: 2022, tags: ["Galaxies", "Formation", "Evolution", "Simulations", "Observations", "Redshift Surveys"] }, // More than 5 tags
        { id: "pub8", title: "Dark Matter Distribution in Galaxies", category: "Dissertation", year: 2014, tags: ["Dark Matter", "Galaxies", "Haloes"] },
        { id: "pub9", title: "Supermassive Black Hole Growth", category: "Confluence", year: 2017, tags: ["Black Holes", "AGN", "Galaxy Evolution"] },
        { id: "pub10", title: "The Cosmic Microwave Background", category: "Thesis", year: 2008, tags: ["Cosmology", "CMB", "Early Universe"] },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
};

// Define all possible publication categories
const allCategories: PublicationCategory[] = ['Thesis', 'Dissertation', 'Confluence', 'Synergy'];

// Simple debounce hook to delay execution of a function after input stops
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        // Set up a timer to update the debounced value after the specified delay
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Clean up the timer if the value changes or the component unmounts
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]); // Re-run effect if value or delay changes

    return debouncedValue;
}

// Sub-component for rendering a single publication item in the list
const PublicationItem = ({ publication, onSelectPublication }: {
    publication: Publication;
    onSelectPublication?: (publication: Publication) => void; // Callback when item is clicked
}) => {
    const { id, title, category, year, tags } = publication;
    // State to control whether all tags are shown or just the first few
    const [showAllTags, setShowAllTags] = useState(false);
    // Determine which tags to display based on the state
    const displayedTags = showAllTags ? tags : tags.slice(0, 5); // Show max 5 tags initially
    const remainingTagCount = tags.length - displayedTags.length;

    // Handle click event on the "Show more" button for tags
    const handleShowMoreTags = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation(); // Prevent the main item click event from firing
        setShowAllTags(true);
    };

    return (
        <div
            key={id}
            className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors p-4 rounded-md"
            onClick={() => onSelectPublication?.(publication)} // Trigger callback on click
            role="button" // Accessibility: Indicate it's clickable
            tabIndex={0} // Accessibility: Make it focusable
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelectPublication?.(publication)} // Accessibility: Trigger on Enter/Space
        >
            {/* Publication Title */}
            <h3 className="text-lg font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200 mb-1">
                {title}
            </h3>

            {/* Category and Year Information */}
            <div className="flex flex-wrap items-center text-gray-600 dark:text-gray-400 text-sm mb-2">
                <span>
                    <span className="font-medium">Category:</span> {category}
                </span>
                <span className="mx-2 text-gray-400 dark:text-gray-500">•</span> {/* Separator */}
                <span>
                    <span className="font-medium">Year:</span> {year}
                </span>
            </div>

            {/* Tags Section */}
            {tags.length > 0 && (
                <div className="mt-2">
                    {/* Displayed Tags */}
                    <div className="flex flex-wrap gap-1">
                        {displayedTags.map(tag => (
                            <span key={tag} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full inline-flex items-center">
                                <Tag className="w-3 h-3 mr-1" /> {/* Tag Icon */}
                                {tag}
                            </span>
                        ))}
                    </div>
                    {/* "Show more" button if there are hidden tags */}
                    {remainingTagCount > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleShowMoreTags}
                            className="text-xs h-auto px-3 py-1 mt-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                            aria-label={`Show ${remainingTagCount} more tags for ${title}`}
                        >
                            Show {remainingTagCount} more
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
};

// Sub-component for handling search, filtering, and displaying publication results
const SearchResults = ({ publications, onSelectPublication, allTags }: {
    publications: Publication[];
    onSelectPublication?: (publication: Publication) => void; // Callback when a result is clicked
    allTags: string[]; // List of all unique tags available for filtering
}) => {
    const [searchQuery, setSearchQuery] = useState(''); // State for the search input value
    const [selectedCategories, setSelectedCategories] = useState<PublicationCategory[]>([]); // State for selected category filters
    const [selectedTags, setSelectedTags] = useState<string[]>([]); // State for selected tag filters
    const [isTagFilterOpen, setIsTagFilterOpen] = useState(false); // State for controlling tag filter section visibility
    const debouncedSearchQuery = useDebounce(searchQuery, 300); // Debounce search input by 300ms

    // Handle changes in the search input field
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    // Handle clicks on category filter buttons (toggle selection)
    const handleCategoryChange = useCallback((category: PublicationCategory) => {
        setSelectedCategories((prev) =>
            prev.includes(category)
                ? prev.filter((c) => c !== category) // Remove if already selected
                : [...prev, category] // Add if not selected
        );
    }, []); // Empty dependency array means this function is created once

    // Handle clicks on tag filter buttons (toggle selection)
    const handleTagChange = useCallback((tag: string) => {
        setSelectedTags((prev) =>
            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
        );
    }, []); // Empty dependency array

    // Apply filters (search, category, tag) and sort results
    // useMemo optimizes this by only recalculating when dependencies change
    const filteredResults = useMemo(() => {
        let results = publications; // Start with all publications

        // Apply category filter
        if (selectedCategories.length > 0) {
            results = results.filter((pub) => selectedCategories.includes(pub.category));
        }

        // Apply tag filter (publication must have at least one selected tag)
        if (selectedTags.length > 0) {
            results = results.filter((pub) =>
                pub.tags.some((tag) => selectedTags.includes(tag))
            );
        }

        // Apply search query filter (case-insensitive title search)
        if (debouncedSearchQuery) {
            const query = debouncedSearchQuery.toLowerCase();
            results = results.filter((item) =>
                item.title.toLowerCase().includes(query)
            );
        }

        // Sort final results by year descending (most recent first)
        results.sort((a, b) => b.year - a.year);

        return results;
    }, [publications, selectedCategories, selectedTags, debouncedSearchQuery]); // Recalculate if these change

    return (
        <div className="space-y-6">
            {/* Search and Category Filter Section */}
            <div className="mb-6">
                {/* Search Input */}
                <div className="relative">
                    <Input
                        type="text"
                        placeholder="Search works by title..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md text-gray-800 focus:outline-none focus:ring-2
                                   focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:ring-blue-400"
                        aria-label="Search publications by title"
                    />
                    {/* Search Icon */}
                    <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                {/* Category Filter Buttons */}
                <div className="flex flex-wrap items-center gap-2 mt-4">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 shrink-0">Categories:</span>
                    {allCategories.map((category) => (
                        <Button
                            key={category}
                            variant="outline"
                            size="sm"
                            onClick={() => handleCategoryChange(category)}
                            className={cn( // Dynamically set classes based on selection state
                                "rounded-full text-xs px-3 py-1 h-auto transition-colors duration-150",
                                selectedCategories.includes(category)
                                    ? "bg-blue-500 text-white hover:bg-blue-600 border-blue-500" // Selected style
                                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600" // Default style
                            )}
                            aria-pressed={selectedCategories.includes(category)} // Accessibility: Indicate selection state
                        >
                            {category}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Tag Filter Section (Collapsible) */}
            <div className="mb-6">
                {/* Button to toggle tag filter visibility */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsTagFilterOpen(!isTagFilterOpen)}
                    className="text-sm px-3 py-1.5 h-auto border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                    aria-expanded={isTagFilterOpen} // Accessibility: Indicate expanded state
                    aria-controls="tag-filter-content" // Accessibility: Link button to content
                >
                    Filter by Tags
                    {/* Chevron icon indicating open/closed state */}
                    {isTagFilterOpen ? (
                        <ChevronUp className="ml-2 h-4 w-4" />
                    ) : (
                        <ChevronDown className="ml-2 h-4 w-4" />
                    )}
                </Button>

                {/* Animated tag filter content */}
                <AnimatePresence>
                    {isTagFilterOpen && (
                        <motion.div
                            id="tag-filter-content" // Accessibility: ID for aria-controls
                            initial={{ height: 0, opacity: 0 }} // Start collapsed and transparent
                            animate={{ height: 'auto', opacity: 1 }} // Animate to auto height and full opacity
                            exit={{ height: 0, opacity: 0 }} // Animate back to collapsed
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            className="mt-2 overflow-hidden" // Hide overflow during animation
                        >
                            {/* Tag Filter Buttons */}
                            <div className="flex flex-wrap items-center gap-2 mt-2 border-t border-gray-200 dark:border-gray-700 pt-3">
                                {allTags.length > 0 ? allTags.map((tag) => (
                                    <Button
                                        key={tag}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleTagChange(tag)}
                                        className={cn( // Dynamic classes based on selection
                                            "rounded-full text-xs px-3 py-1 h-auto inline-flex items-center transition-colors duration-150",
                                            selectedTags.includes(tag)
                                                ? "bg-green-500 text-white hover:bg-green-600 border-green-500" // Selected style
                                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600" // Default style
                                        )}
                                        aria-pressed={selectedTags.includes(tag)} // Accessibility: Indicate selection state
                                    >
                                        <Tag className="w-3 h-3 mr-1" /> {/* Tag Icon */}
                                        {tag}
                                    </Button>
                                )) : <p className="text-sm text-gray-500 dark:text-gray-400">No tags available.</p>}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Results Container */}
            <div className="space-y-4">
                {filteredResults.length > 0 ? (
                    // Map through filtered results and render PublicationItem for each
                    filteredResults.map((result) => (
                        <PublicationItem
                            key={result.id}
                            publication={result}
                            onSelectPublication={onSelectPublication} // Pass down the selection handler
                        />
                    ))
                ) : (
                    // Display message if no results match filters
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-md shadow-sm">
                        No results found matching your criteria.
                    </div>
                )}
            </div>
        </div>
    );
};

// Main Page Component for the Author Profile
const AuthorProfilePage: NextPage = () => {
    // State for the author data (initially loaded with sample data)
    const [author, setAuthor] = useState<Author>(sampleAuthor);
    // State to track if the profile is in edit mode
    const [isEditing, setIsEditing] = useState<boolean>(false);
    // State to hold the author data being edited (copy of original)
    const [editedAuthor, setEditedAuthor] = useState<Author>(sampleAuthor);
    // State to store validation errors for input fields
    const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
    // State to hold the raw JSON string for publications being edited
    const [publicationsJson, setPublicationsJson] = useState<string>('');
    // State to store errors related to JSON parsing/validation
    const [jsonError, setJsonError] = useState<string | null>(null);
    // State to hold the publication currently selected for modal view
    const [selectedPublication, setSelectedPublication] = useState<Publication | null>(null);

    // Effect to reset the edit form when toggling edit mode or if base author data changes
    useEffect(() => {
        if (isEditing) {
            // When entering edit mode:
            setEditedAuthor({ ...author }); // Create a fresh copy of current author data
            setPublicationsJson(JSON.stringify(author.publications, null, 2)); // Format current publications as JSON string
            setFieldErrors({}); // Clear previous field errors
            setJsonError(null); // Clear previous JSON errors
        } else {
            // When exiting edit mode:
            setSelectedPublication(null); // Clear any selected publication (close modal if open)
        }
    }, [isEditing, author]); // Re-run if edit mode changes or base author data is updated

    // Generic handler for changes in standard input fields (text, textarea)
    const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        // Update the corresponding field in the editedAuthor state
        setEditedAuthor((prev) => ({
            ...prev,
            [name]: value,
        }));

        // Perform basic required field validation on change for immediate feedback
        if (['full_name', 'affiliation', 'department'].includes(name)) {
            if (!value.trim()) {
                // If field is required and empty/whitespace, set an error
                setFieldErrors((prev) => ({ ...prev, [name]: 'This field is required' }));
            } else {
                // If field is valid, remove its error message
                setFieldErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors[name];
                    return newErrors;
                });
            }
        }
    }, []); // Empty dependency array: function created once

    // Handler specifically for the publications JSON textarea
    const handlePublicationsChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
        const jsonString = e.target.value;
        setPublicationsJson(jsonString); // Update the raw JSON string state immediately

        try {
            // Attempt to parse the JSON string
            const parsedPublications = JSON.parse(jsonString);
            // Validate if it's an array
            if (!Array.isArray(parsedPublications)) {
                throw new Error("Input must be a valid JSON array of publications.");
            }

            // Validate the structure and types of each publication object in the array
            const validCategoriesSet = new Set<PublicationCategory>(allCategories);
            parsedPublications.forEach((pub: any, index: number) => {
                if (typeof pub !== 'object' || pub === null) throw new Error(`Item at index ${index} is not a valid object.`);
                if (!pub.id || typeof pub.id !== 'string') throw new Error(`Publication at index ${index} requires a string 'id'.`);
                if (!pub.title || typeof pub.title !== 'string') throw new Error(`Publication at index ${index} requires a string 'title'.`);
                if (!pub.category || !validCategoriesSet.has(pub.category)) throw new Error(`Publication at index ${index} requires a valid 'category' (${allCategories.join(', ')}).`);
                if (pub.year === undefined || typeof pub.year !== 'number' || !Number.isInteger(pub.year)) throw new Error(`Publication at index ${index} requires an integer 'year'.`);
                if (pub.link !== undefined && pub.link !== null && typeof pub.link !== 'string') throw new Error(`Publication at index ${index} has an invalid 'link' (must be string, null, or undefined).`);
                if (!pub.tags || !Array.isArray(pub.tags) || pub.tags.some((tag: any) => typeof tag !== 'string')) throw new Error(`Publication at index ${index} requires 'tags' to be an array of strings.`);
            });

            // If JSON is valid and structure is correct, update the editedAuthor state
            setEditedAuthor((prev) => ({
                ...prev,
                publications: parsedPublications as Publication[], // Cast to Publication array
            }));
            setJsonError(null); // Clear any previous JSON error
        } catch (error) {
            // If JSON parsing or validation fails, set the error message
            setJsonError(error instanceof Error ? error.message : "Invalid JSON format or structure.");
        }
    }, []); // Empty dependency array

    // Handler for saving the edited changes
    const handleSave = useCallback(() => {
        // Final validation check before saving
        const currentFieldErrors: { [key: string]: string } = {};
        if (!editedAuthor.full_name.trim()) currentFieldErrors.full_name = 'Full name is required';
        if (!editedAuthor.affiliation.trim()) currentFieldErrors.affiliation = 'Affiliation is required';
        if (!editedAuthor.department.trim()) currentFieldErrors.department = 'Department is required';
        setFieldErrors(currentFieldErrors); // Update field errors state

        // Prevent saving if there are any field errors or a JSON error
        if (Object.keys(currentFieldErrors).length > 0 || jsonError) {
            console.error("Save prevented due to validation errors:", { currentFieldErrors, jsonError });
            // Optionally: Add user feedback here (e.g., a toast notification)
            return;
        }

        // Prepare the final author data for saving
        const finalAuthorData: Author = {
            ...editedAuthor,
            // Ensure year_of_graduation is a number or null
            year_of_graduation: editedAuthor.year_of_graduation ? parseInt(String(editedAuthor.year_of_graduation), 10) : null,
            updated_at: new Date().toISOString(), // Update the 'updated_at' timestamp
        };

        // Update the main author state with the saved data
        // In a real app, this would likely involve an API call
        setAuthor(finalAuthorData);
        setIsEditing(false); // Exit edit mode
        console.log("Saved data:", finalAuthorData); // Log saved data (for debugging)
        // Optionally: Add success feedback (e.g., toast notification)
    }, [editedAuthor, jsonError]); // Dependencies: re-create if edited data or JSON error changes

    // Handler for canceling the edit operation
    const handleCancel = useCallback(() => {
        setIsEditing(false); // Exit edit mode
        setFieldErrors({}); // Clear any validation errors
        setJsonError(null); // Clear any JSON errors
        setSelectedPublication(null); // Close the modal if open
    }, []); // Empty dependency array

    // Helper function to get initials from a name for the avatar fallback
    const getInitials = useCallback((name: string) => {
        if (!name) return ''; // Handle empty name case
        return name
            .split(' ') // Split name into parts
            .map((n) => n[0]) // Get the first letter of each part
            .filter(Boolean) // Remove any empty strings (e.g., from multiple spaces)
            .slice(0, 2) // Take the first two initials
            .join('') // Join them together
            .toUpperCase(); // Convert to uppercase
    }, []); // Empty dependency array

    // Determine which author object to display based on whether we are editing or not
    const displayAuthor = isEditing ? editedAuthor : author;

    // Derive all unique tags from the currently displayed publications
    // useMemo ensures this is only recalculated when the publications list changes
    const allTags = useMemo(() =>
        Array.from(new Set(displayAuthor.publications.flatMap(pub => pub.tags))).sort(),
        [displayAuthor.publications] // Dependency: recalculate if publications change
    );

    // Determine if the save button should be disabled based on validation errors or empty required fields
    const isSaveDisabled = useMemo(() =>
        Object.keys(fieldErrors).length > 0 || // Any field errors?
        !!jsonError || // Any JSON error?
        !editedAuthor.full_name.trim() || // Full name empty?
        !editedAuthor.affiliation.trim() || // Affiliation empty?
        !editedAuthor.department.trim(), // Department empty?
        [fieldErrors, jsonError, editedAuthor.full_name, editedAuthor.affiliation, editedAuthor.department] // Dependencies
    );

    // Handler for selecting a publication (opens the modal)
    const handlePublicationSelect = useCallback((publication: Publication) => {
        setSelectedPublication(publication);
    }, []); // Empty dependency array

    // Animation variants for card transitions
    const cardVariants = {
        hidden: { opacity: 0, y: 20 }, // Initial state (invisible, slightly below)
        visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeInOut" } }, // Final state (visible, original position)
    };

    // JSX for the component UI
    return (
        <div className="container mx-auto p-4 md:p-8 bg-background text-foreground min-h-screen font-sans"> {/* Base container */}
            {/* Top Bar: Edit/Save/Cancel Buttons */}
            <div className="flex justify-end mb-4 space-x-2">
                {isEditing ? (
                    // Buttons shown in Edit Mode
                    <>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCancel}
                            className="hover:bg-gray-100 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600"
                        >
                            <XCircle className="mr-2 h-4 w-4" /> Cancel
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleSave}
                            disabled={isSaveDisabled} // Disable button based on validation state
                            aria-disabled={isSaveDisabled} // Accessibility: Indicate disabled state
                            className={cn( // Conditional styling for disabled state
                                "text-white",
                                isSaveDisabled
                                    ? "bg-blue-300 dark:bg-blue-800 cursor-not-allowed opacity-70" // Disabled style
                                    : "bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700" // Enabled style
                            )}
                        >
                            <Save className="mr-2 h-4 w-4" /> Save Changes
                        </Button>
                    </>
                ) : (
                    // Button shown in View Mode
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)} // Enter edit mode on click
                        className="hover:bg-gray-100 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600"
                    >
                        <Edit className="mr-2 h-4 w-4" /> Edit Profile
                    </Button>
                )}
            </div>

            {/* Main Layout: Two Columns (Left: Profile Info, Right: Bio & Works) */}
            <div className="flex flex-col md:flex-row gap-6 md:gap-8">

                {/* Left Column: Profile Picture, Basic Info, Links */}
                <div className="w-full md:w-1/3 lg:w-1/4 flex-shrink-0">
                    <motion.div // Animated card container
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <Card className="shadow-lg dark:bg-gray-800 overflow-hidden"> {/* Added overflow-hidden */}
                            <CardHeader className="items-center text-center pt-6">
                                {/* Avatar Section */}
                                <Avatar className="w-24 h-24 mb-4 border-2 border-primary dark:border-blue-500 mx-auto">
                                    {displayAuthor.profile_picture ? (
                                        // Display profile picture if available
                                        <AvatarImage
                                            src={displayAuthor.profile_picture}
                                            alt={`Profile picture of ${displayAuthor.full_name}`}
                                            crossOrigin="anonymous" // Add if loading images from different origins
                                        />
                                    ) : (
                                        // Placeholder if no image (e.g., dashed circle with initials)
                                        <div className="bg-muted dark:bg-gray-700 border border-dashed border-gray-300 dark:border-gray-600 rounded-full w-full h-full flex items-center justify-center">
                                            <span className="text-2xl font-semibold text-muted-foreground dark:text-gray-400">{getInitials(displayAuthor.full_name || '')}</span>
                                        </div>
                                    )}
                                    {/* Fallback initials if image fails to load */}
                                    <AvatarFallback className="text-2xl dark:bg-gray-700 dark:text-gray-400">{getInitials(displayAuthor.full_name || '')}</AvatarFallback>
                                </Avatar>

                                {/* Name Section (Editable/Display) */}
                                {isEditing ? (
                                    <div className="w-full space-y-1 mb-2">
                                        <Label htmlFor="full_name" className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name <span className="text-destructive">*</span></Label>
                                        <Input
                                            id="full_name"
                                            name="full_name"
                                            value={editedAuthor.full_name}
                                            onChange={handleInputChange}
                                            className={cn( // Conditional styling for validation
                                                "w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2",
                                                fieldErrors.full_name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500 dark:border-gray-600 dark:focus:ring-blue-400',
                                                "dark:bg-gray-700 dark:text-white",
                                                "transition-colors duration-200",
                                                "box-border text-center" // Center text in edit mode
                                            )}
                                            aria-required="true"
                                            aria-invalid={!!fieldErrors.full_name} // Accessibility: Indicate invalid state
                                            aria-describedby={fieldErrors.full_name ? 'full_name-error' : undefined} // Accessibility: Link error message
                                        />
                                        {/* Display validation error message */}
                                        {fieldErrors.full_name && (
                                            <p id="full_name-error" className="text-xs text-red-500 dark:text-red-400 mt-1">
                                                {fieldErrors.full_name}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    // Display mode for name
                                    <CardTitle className="text-2xl font-bold text-gray-800 dark:text-white">
                                        {displayAuthor.full_name}
                                    </CardTitle>
                                )}
                                {/* Affiliation Section (Editable/Display) */}
                                {isEditing ? (
                                    <div className="w-full space-y-1 mb-2">
                                        <Label htmlFor="affiliation" className="text-sm font-medium text-gray-700 dark:text-gray-300">Affiliation <span className="text-destructive">*</span></Label>
                                        <Input
                                            id="affiliation"
                                            name="affiliation"
                                            value={editedAuthor.affiliation}
                                            onChange={handleInputChange}
                                            className={cn( // Conditional styling for validation
                                                "w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2",
                                                fieldErrors.affiliation ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500 dark:border-gray-600 dark:focus:ring-blue-400",
                                                "dark:bg-gray-700 dark:text-white",
                                                "transition-colors duration-200",
                                                "box-border text-center" // Center text in edit mode
                                            )}
                                            aria-required="true"
                                            aria-invalid={!!fieldErrors.affiliation}
                                            aria-describedby={fieldErrors.affiliation ? "affiliation-error" : undefined}
                                        />
                                        {/* Display validation error message */}
                                        {fieldErrors.affiliation && (
                                            <p id="affiliation-error" className="text-xs text-red-500 dark:text-red-400 mt-1">
                                                {fieldErrors.affiliation}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    // Display mode for affiliation
                                    <CardDescription className="text-gray-600 dark:text-gray-400">
                                        {displayAuthor.affiliation}
                                    </CardDescription>
                                )}
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                                {/* Department Section (Editable/Display) */}
                                {isEditing ? (
                                    <div className="w-full space-y-1 mb-4">
                                        <Label htmlFor="department" className="text-sm font-medium text-gray-700 dark:text-gray-300">Department <span className="text-destructive">*</span></Label>
                                        <Input
                                            id="department"
                                            name="department"
                                            value={editedAuthor.department}
                                            onChange={handleInputChange}
                                            className={cn( // Conditional styling for validation
                                                "w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2",
                                                fieldErrors.department ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500 dark:border-gray-600 dark:focus:ring-blue-400",
                                                "dark:bg-gray-700 dark:text-white",
                                                "transition-colors duration-200",
                                                "box-border"
                                            )}
                                            aria-required="true"
                                            aria-invalid={!!fieldErrors.department}
                                            aria-describedby={fieldErrors.department ? "department-error" : undefined}
                                        />
                                        {/* Display validation error message */}
                                        {fieldErrors.department && (
                                            <p id="department-error" className="text-xs text-red-500 dark:text-red-400 mt-1">
                                                {fieldErrors.department}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    // Display mode for department
                                    <div className="mb-4 text-sm">
                                        <span className="font-semibold text-gray-700 dark:text-gray-300">Department: </span>
                                        <span className="text-gray-600 dark:text-gray-400">{displayAuthor.department}</span>
                                    </div>
                                )}

                                {/* Year of Graduation Section (Editable/Display) */}
                                {isEditing ? (
                                    <div className="w-full space-y-1 mb-4">
                                        <Label htmlFor="year_of_graduation" className="text-sm font-medium text-gray-700 dark:text-gray-300">Year of Graduation</Label>
                                        <Input
                                            id="year_of_graduation"
                                            name="year_of_graduation"
                                            value={editedAuthor.year_of_graduation || ''} // Handle null/undefined
                                            onChange={handleInputChange}
                                            type="number" // Use number type for better input control (though value is string in state initially)
                                            placeholder="e.g., 2010"
                                            className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-400 transition-colors duration-200"
                                        />
                                    </div>
                                ) : (
                                    // Display mode for graduation year (only if present)
                                    displayAuthor.year_of_graduation && (
                                        <div className="mb-4 text-sm">
                                            <span className="font-semibold text-gray-700 dark:text-gray-300">Graduated: </span>
                                            <span className="text-gray-600 dark:text-gray-400">
                                                {displayAuthor.year_of_graduation}
                                            </span>
                                        </div>
                                    )
                                )}

                                <Separator className="my-4 bg-gray-200 dark:bg-gray-700" />

                                {/* Contact Information Section */}
                                <h3 className="text-base font-semibold mb-3 text-gray-800 dark:text-white">Contact</h3>
                                {/* Email (Editable/Display) */}
                                {isEditing ? (
                                    <div className="w-full space-y-1 mb-3">
                                        <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            value={editedAuthor.email || ''}
                                            onChange={handleInputChange}
                                            type="email" // Use email type for basic browser validation
                                            placeholder="e.g., name@example.com"
                                            className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-400 transition-colors duration-200"
                                        />
                                    </div>
                                ) : (
                                    // Display mode for email (only if present)
                                    displayAuthor.email && (
                                        <div className="mb-2 flex items-center text-sm">
                                            <Mail className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400 shrink-0" />
                                            <a href={`mailto:${displayAuthor.email}`} className="text-gray-600 dark:text-gray-400 hover:underline break-all">{displayAuthor.email}</a>
                                        </div>
                                    )
                                )}
                                {/* LinkedIn (Editable/Display) */}
                                {isEditing ? (
                                    <div className="w-full space-y-1 mb-3">
                                        <Label htmlFor="linkedin" className="text-sm font-medium text-gray-700 dark:text-gray-300">LinkedIn Profile URL</Label>
                                        <Input
                                            id="linkedin"
                                            name="linkedin"
                                            value={editedAuthor.linkedin || ''}
                                            onChange={handleInputChange}
                                            type="url" // Use url type for basic browser validation
                                            placeholder="e.g., https://linkedin.com/in/..."
                                            className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-400 transition-colors duration-200"
                                        />
                                    </div>
                                ) : (
                                    // Display mode for LinkedIn (only if present)
                                    displayAuthor.linkedin && (
                                        <div className="mb-2 flex items-center text-sm">
                                            <Linkedin className="mr-2 h-4 w-4 text-blue-500 shrink-0" />
                                            <a
                                                href={displayAuthor.linkedin}
                                                target="_blank" // Open in new tab
                                                rel="noopener noreferrer" // Security best practice
                                                className="text-blue-600 hover:underline dark:text-blue-400 break-all"
                                            >
                                                {/* Shorten display URL for cleaner look */}
                                                {displayAuthor.linkedin.replace(/^https?:\/\/(www\.)?/, '')}
                                            </a>
                                        </div>
                                    )
                                )}
                                {/* ORCID ID (Editable/Display) */}
                                {isEditing ? (
                                    <div className="w-full space-y-1">
                                        <Label htmlFor="orcid_id" className="text-sm font-medium text-gray-700 dark:text-gray-300">ORCID ID</Label>
                                        <Input
                                            id="orcid_id"
                                            name="orcid_id"
                                            value={editedAuthor.orcid_id || ''}
                                            onChange={handleInputChange}
                                            type="text" // Simple text input
                                            placeholder="e.g., 0000-0001-2345-6789"
                                            className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-400 transition-colors duration-200"
                                        />
                                    </div>
                                ) : (
                                    // Display mode for ORCID ID (only if present)
                                    displayAuthor.orcid_id && (
                                        <div className="flex items-center text-sm">
                                            {/* Simple inline SVG ORCID-like icon */}
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 256" className="mr-2 text-green-600 dark:text-green-500 shrink-0" fill="currentColor">
                                                <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm38.54,136.76c-14.45,14.45-39.3,14.45-53.75,0-1.17-1.17-2.25-2.41-3.24-3.71a56,56,0,0,1-17.1-40.51A55.74,55.74,0,0,1,110,76.06a56,56,0,0,1,79.2,0,55.74,55.74,0,0,1,17.1,40.51,56,56,0,0,1-17.1,40.51C187.77,158.31,177.69,161.18,166.54,160.76Zm-80-30.19a32,32,0,1,1,32,32A32.06,32.06,0,0,1,86.51,130.57Z" />
                                            </svg>
                                            <span className="text-gray-600 dark:text-gray-400 break-all">{displayAuthor.orcid_id}</span>
                                        </div>
                                    )
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* Right Column: Biography and Works */}
                <div className="w-full md:w-2/3 lg:w-3/4">
                    {/* Biography Card */}
                    <motion.div // Animated card container
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <Card className="shadow-lg dark:bg-gray-800">
                            <CardHeader>
                                <CardTitle className="text-2xl font-bold text-gray-800 dark:text-white">Biography</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {/* Biography (Editable/Display) */}
                                {isEditing ? (
                                    <div className="w-full space-y-1">
                                        <Label htmlFor="bio" className="text-sm font-medium text-gray-700 dark:text-gray-300">Biography</Label>
                                        <Textarea
                                            id="bio"
                                            name="bio"
                                            value={editedAuthor.bio || ''}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-400 transition-colors duration-200 min-h-[150px]" // Set minimum height
                                            placeholder="Enter biography..."
                                        />
                                    </div>
                                ) : (
                                    // Display mode for biography
                                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line text-sm leading-relaxed">{displayAuthor.bio || 'No biography available.'}</p>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Works (Publications) Card */}
                    <motion.div // Animated card container
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        className="mt-6" // Margin top for spacing
                    >
                        <Card className="shadow-lg dark:bg-gray-800">
                            <CardHeader>
                                <CardTitle className="text-2xl font-bold text-gray-800 dark:text-white">Works ({displayAuthor.publications.length})</CardTitle>
                                <CardDescription className="text-gray-600 dark:text-gray-400">
                                    {/* Description changes based on mode */}
                                    {isEditing
                                        ? "Edit publications below using valid JSON format. Ensure each object has 'id', 'title', 'category', 'year', and 'tags' (array of strings). 'link' is optional."
                                        : "Browse or search the list of publications."
                                    }
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {/* Publications (Editable JSON/Display SearchResults) */}
                                {isEditing ? (
                                    <div className="w-full space-y-2">
                                        <Label htmlFor="publications" className="text-sm font-medium text-gray-700 dark:text-gray-300">Publications (JSON Array)</Label>
                                        <Textarea
                                            id="publications"
                                            name="publications" // Although not directly updating editedAuthor.publications, it's conceptually linked
                                            value={publicationsJson} // Controlled by the raw JSON state
                                            onChange={handlePublicationsChange} // Use the specific JSON handler
                                            className={cn( // Conditional styling for JSON validation
                                                "w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2",
                                                "dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200 dark:focus:ring-blue-400", // Dark mode styles for code-like area
                                                "transition-colors duration-200 min-h-[250px] font-mono text-xs leading-normal", // Monospace font, smaller size
                                                jsonError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500 dark:border-gray-600' // Error border
                                            )}
                                            aria-invalid={!!jsonError} // Accessibility: Indicate invalid state
                                            aria-describedby={jsonError ? 'publications-error' : undefined} // Accessibility: Link error message
                                            spellCheck="false" // Disable spellcheck for JSON
                                        />
                                        {/* Display JSON validation error message */}
                                        {jsonError && (
                                            <p id="publications-error" className="text-xs text-red-500 dark:text-red-400 mt-1">
                                                JSON Error: {jsonError}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    // Display mode: Show the SearchResults component
                                    <SearchResults
                                        publications={displayAuthor.publications} // Pass current publications
                                        onSelectPublication={handlePublicationSelect} // Pass selection handler
                                        allTags={allTags} // Pass all unique tags for filtering
                                    />
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>

            {/* Modal for displaying full publication details */}
            <AnimatePresence>
                {selectedPublication && ( // Render modal only if a publication is selected
                    <motion.div
                        initial={{ opacity: 0 }} // Start transparent
                        animate={{ opacity: 1 }} // Fade in
                        exit={{ opacity: 0 }} // Fade out
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" // Overlay styles
                        onClick={handleCancel} // Close modal when clicking the overlay (uses handleCancel to also clear selection)
                        role="dialog" // Accessibility: Identify as dialog
                        aria-modal="true" // Accessibility: Indicate it's modal
                        aria-labelledby="publication-modal-title" // Accessibility: Link title
                        aria-describedby="publication-modal-description" // Accessibility: Link description
                    >
                        {/* Modal Content */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} // Start slightly smaller and transparent
                            animate={{ scale: 1, opacity: 1 }} // Animate to full size and opacity
                            exit={{ scale: 0.9, opacity: 0 }} // Animate back out
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 space-y-4" // Modal container styles
                            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking *inside* the modal content
                        >
                            {/* Modal Title */}
                            <h2 id="publication-modal-title" className="text-2xl font-bold text-gray-900 dark:text-white">{selectedPublication.title}</h2>
                            {/* Modal Description (Content) */}
                            <div id="publication-modal-description" className="space-y-3 text-sm">
                                {/* Category */}
                                <div className="text-gray-700 dark:text-gray-300">
                                    <span className="font-semibold">Category:</span> {selectedPublication.category}
                                </div>
                                {/* Year */}
                                <div className="text-gray-700 dark:text-gray-300">
                                    <span className="font-semibold">Year:</span> {selectedPublication.year}
                                </div>
                                {/* Link (if available) */}
                                {selectedPublication.link && (
                                    <div className="text-gray-700 dark:text-gray-300 flex items-start">
                                        <span className="font-semibold mr-1 shrink-0">Link:</span>
                                        <a
                                            href={selectedPublication.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline dark:text-blue-400 break-all inline-flex items-center"
                                        >
                                            {selectedPublication.link}
                                            <LinkIcon className="ml-1 h-3 w-3 shrink-0" /> {/* Link Icon */}
                                        </a>
                                    </div>
                                )}
                                {/* Tags (if available) */}
                                {selectedPublication.tags.length > 0 && (
                                    <div className="text-gray-700 dark:text-gray-300">
                                        <span className="font-semibold">Tags:</span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {selectedPublication.tags.map(tag => (
                                                <span key={tag} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full inline-flex items-center">
                                                    <Tag className="w-3 h-3 mr-1" /> {/* Tag Icon */}
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            {/* Modal Close Button */}
                            <div className="flex justify-end pt-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedPublication(null)} // Close modal by clearing selection
                                    className="border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    Close
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Export the component for use in a Next.js application
export default AuthorProfilePage;
