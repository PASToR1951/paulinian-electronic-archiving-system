import React, { useState, ChangeEvent, useEffect, useMemo, useCallback } from 'react';
import type { NextPage } from 'next';
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
    year_of_graduation?: number | null | string; // Allow string for input flexibility
    email?: string | null;
    linkedin?: string | null;
    orcid_id?: string | null;
    bio?: string | null;
    profile_picture?: string | null; // URL or path to image
    publications: Publication[]; // Array of publications
    created_at: string;
    updated_at: string;
}

// Sample Author Data with Publications
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
    profile_picture: undefined,
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

const allCategories: PublicationCategory[] = ['Thesis', 'Dissertation', 'Confluence', 'Synergy'];

// Simple debounce hook
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

// Sub-component for rendering a single publication item
const PublicationItem = ({ publication, onSelectPublication }: { publication: Publication; onSelectPublication?: (publication: Publication) => void }) => {
    const { id, title, category, year, tags } = publication;
    const [showAllTags, setShowAllTags] = useState(false);
    const displayedTags = showAllTags ? tags : tags.slice(0, 5);
    const remainingTagCount = tags.length - displayedTags.length;

    return (
        <div
            key={id}
            className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors p-4 rounded-md"
            onClick={() => onSelectPublication?.(publication)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelectPublication?.(publication)}
        >
            {/* Title */}
            <h3 className="text-lg font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200 mb-1">
                {title}
            </h3>

            {/* Category and Year */}
            <div className="flex flex-wrap items-center text-gray-600 dark:text-gray-400 text-sm mb-2">
                <span>
                    <span className="font-medium">Category:</span> {category}
                </span>
                <span className="mx-2 text-gray-400 dark:text-gray-500">•</span>
                <span>
                    <span className="font-medium">Year:</span> {year}
                </span>
            </div>

            {/* Tags */}
            {tags.length > 0 && (
                <div className="mt-2">
                    <div className="flex flex-wrap gap-1">
                        {displayedTags.map(tag => (
                            <span key={tag} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full inline-flex items-center">
                                <Tag className="w-3 h-3 mr-1" />
                                {tag}
                            </span>
                        ))}
                    </div>
                    {remainingTagCount > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAllTags(true)}
                            className="text-xs h-auto px-3 py-1 mt-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            Show {remainingTagCount} more
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
};

const SearchResults = ({ publications, onSelectPublication, allTags }: {
    publications: Publication[];
    onSelectPublication?: (publication: Publication) => void;
    allTags: string[];
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<PublicationCategory[]>([]);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isTagFilterOpen, setIsTagFilterOpen] = useState(false); // State for controlling tag filter visibility
    const debouncedSearchQuery = useDebounce(searchQuery, 300); // Debounce search input by 300ms

    // Handle search input changes
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    // Handle category filter changes
    const handleCategoryChange = useCallback((category: PublicationCategory) => {
        setSelectedCategories((prev) =>
            prev.includes(category)
                ? prev.filter((c) => c !== category)
                : [...prev, category]
        );
    }, []);

    // Handle tag filter changes
    const handleTagChange = useCallback((tag: string) => {
        setSelectedTags((prev) =>
            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
        );
    }, []);

    // Apply filters using useMemo for optimized filtering
    const filteredResults = useMemo(() => {
        let results = publications;

        if (selectedCategories.length > 0) {
            results = results.filter((pub) => selectedCategories.includes(pub.category));
        }

        if (selectedTags.length > 0) {
            results = results.filter((pub) =>
                pub.tags.some((tag) => selectedTags.includes(tag))
            );
        }

        if (debouncedSearchQuery) {
            const query = debouncedSearchQuery.toLowerCase();
            results = results.filter((item) =>
                item.title.toLowerCase().includes(query)
            );
        }

        // Sort final results by year descending
        results.sort((a, b) => b.year - a.year);

        return results;
    }, [publications, selectedCategories, selectedTags, debouncedSearchQuery]);

    return (
        <div className="space-y-6">
            {/* Search Input */}
            <div className="mb-6">
                <div className="relative">
                    <Input
                        type="text"
                        placeholder="Search works by title..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md text-gray-800 focus:outline-none focus:ring-2
                                   focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:ring-blue-400"
                        aria-label="Search publications"
                    />
                    <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                {/* Category Filter */}
                <div className="flex flex-wrap items-center gap-2 mt-4">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 shrink-0">Categories:</span>
                    {allCategories.map((category) => (
                        <Button
                            key={category}
                            variant="outline"
                            size="sm"
                            onClick={() => handleCategoryChange(category)}
                            className={cn(
                                "rounded-full text-xs px-3 py-1 h-auto",
                                selectedCategories.includes(category)
                                    ? "bg-blue-500 text-white hover:bg-blue-600 border-blue-500"
                                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600"
                            )}
                        >
                            {category}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Tag Filter */}
            <div className="mb-6">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsTagFilterOpen(!isTagFilterOpen)}
                    className="text-sm px-3 py-1.5 h-auto border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                >
                    Tags
                    {isTagFilterOpen ? (
                        <ChevronUp className="ml-2 h-4 w-4" />
                    ) : (
                        <ChevronDown className="ml-2 h-4 w-4" />
                    )}
                </Button>

                <AnimatePresence>
                    {isTagFilterOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            className="mt-2 overflow-hidden"
                        >
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                {allTags.map((tag) => (
                                    <Button
                                        key={tag}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleTagChange(tag)}
                                        className={cn(
                                            "rounded-full text-xs px-3 py-1 h-auto inline-flex items-center",
                                            selectedTags.includes(tag)
                                                ? "bg-green-500 text-white hover:bg-green-600 border-green-500"
                                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600"
                                        )}
                                    >
                                        <Tag className="w-3 h-3 mr-1" />
                                        {tag}
                                    </Button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Results container */}
            <div className="space-y-4">
                {filteredResults.length > 0 ? (
                    filteredResults.map((result) => (
                        <PublicationItem
                            key={result.id}
                            publication={result}
                            onSelectPublication={onSelectPublication}
                        />
                    ))
                ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-md shadow-sm">
                        No results found matching your criteria.
                    </div>
                )}
            </div>
        </div>
    );
};

const AuthorProfilePage: NextPage = () => {
    const [author, setAuthor] = useState<Author>(sampleAuthor);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [editedAuthor, setEditedAuthor] = useState<Author>(sampleAuthor);
    const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
    const [publicationsJson, setPublicationsJson] = useState<string>('');
    const [jsonError, setJsonError] = useState<string | null>(null);
    const [selectedPublication, setSelectedPublication] = useState<Publication | null>(null);

    // Effect to reset edit form when toggling edit mode or when base author data changes
    useEffect(() => {
        if (isEditing) {
            setEditedAuthor({ ...author });
            setPublicationsJson(JSON.stringify(author.publications, null, 2));
            setFieldErrors({});
            setJsonError(null);
        } else {
            // Clear selection when exiting edit mode
            setSelectedPublication(null);
        }
    }, [isEditing, author]);

    // Generic handler for simple input field changes
    const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditedAuthor((prev) => ({
            ...prev,
            [name]: value,
        }));

        // Basic required field validation on change
        if (['full_name', 'affiliation', 'department'].includes(name)) {
            if (!value.trim()) {
                setFieldErrors((prev) => ({ ...prev, [name]: 'This field is required' }));
            } else {
                setFieldErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors[name];
                    return newErrors;
                });
            }
        }
    }, []);

    // Handler specifically for the publications JSON textarea
    const handlePublicationsChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
        const jsonString = e.target.value;
        setPublicationsJson(jsonString); // Update the raw JSON string state

        try {
            const parsedPublications = JSON.parse(jsonString);
            if (!Array.isArray(parsedPublications)) {
                throw new Error("Input must be a valid JSON array of publications.");
            }

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

            setEditedAuthor((prev) => ({
                ...prev,
                publications: parsedPublications as Publication[],
            }));
            setJsonError(null);
        } catch (error) {
            setJsonError(error instanceof Error ? error.message : "Invalid JSON format or structure.");
        }
    }, []);

    // Handler for saving changes
    const handleSave = useCallback(() => {
        const currentFieldErrors: { [key: string]: string } = {};
        if (!editedAuthor.full_name.trim()) currentFieldErrors.full_name = 'Full name is required';
        if (!editedAuthor.affiliation.trim()) currentFieldErrors.affiliation = 'Affiliation is required';
        if (!editedAuthor.department.trim()) currentFieldErrors.department = 'Department is required';
        setFieldErrors(currentFieldErrors);

        if (Object.keys(currentFieldErrors).length > 0 || jsonError) {
            console.error("Save prevented due to errors:", { currentFieldErrors, jsonError });
            return; // Prevent saving
        }

        const finalAuthorData: Author = {
            ...editedAuthor,
            year_of_graduation: editedAuthor.year_of_graduation ? parseInt(String(editedAuthor.year_of_graduation), 10) : null,
            updated_at: new Date().toISOString(),
        };

        setAuthor(finalAuthorData);
        setIsEditing(false);
        console.log("Saved data:", finalAuthorData);
    }, [editedAuthor, jsonError]);

    // Handler for canceling edits
    const handleCancel = useCallback(() => {
        setIsEditing(false);
        setFieldErrors({});
        setJsonError(null);
        setSelectedPublication(null);
    }, []);

    // Helper to get initials for avatar fallback
    const getInitials = useCallback((name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .filter(Boolean)
            .slice(0, 2) // Limit to 2 initials
            .join('')
            .toUpperCase();
    }, []);

    // Determine which author object to display
    const displayAuthor = isEditing ? editedAuthor : author;

    // Derive all unique tags from the currently displayed publications
    const allTags = useMemo(() =>
        Array.from(new Set(displayAuthor.publications.flatMap(pub => pub.tags))).sort(),
        [displayAuthor.publications]
    );

    // Determine if the save button should be disabled
    const isSaveDisabled = useMemo(() =>
        Object.keys(fieldErrors).length > 0 || !!jsonError || !editedAuthor.full_name.trim() || !editedAuthor.affiliation.trim() || !editedAuthor.department.trim(),
        [fieldErrors, jsonError, editedAuthor.full_name, editedAuthor.affiliation, editedAuthor.department]
    );

    const handlePublicationSelect = useCallback((publication: Publication) => {
        setSelectedPublication(publication);
    }, []);

    // Animation variants
    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeInOut" } },
    };

    return (
        <div className="container mx-auto p-4 md:p-8 bg-background text-foreground min-h-screen">
            {/* Edit/Save/Cancel Buttons */}
            <div className="flex justify-end mb-4 space-x-2">
                {isEditing ? (
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
                            disabled={isSaveDisabled}
                            aria-disabled={isSaveDisabled}
                            className={cn(
                                "text-white",
                                isSaveDisabled
                                    ? "bg-blue-300 dark:bg-blue-800 cursor-not-allowed"
                                    : "bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                            )}
                        >
                            <Save className="mr-2 h-4 w-4" /> Save Changes
                        </Button>
                    </>
                ) : (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="hover:bg-gray-100 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600"
                    >
                        <Edit className="mr-2 h-4 w-4" /> Edit Profile
                    </Button>
                )}
            </div>

            <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                {/* Left Column: Profile Picture, Basic Info, Links */}
                <div className="w-full md:w-1/3 lg:w-1/4 flex-shrink-0">
                    <motion.div
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <Card className="shadow-lg dark:bg-gray-800">
                            <CardHeader className="items-center text-center pt-6">
                                {/* Avatar */}
                                <Avatar className="w-24 h-24 mb-4 border-2 border-primary dark:border-blue-500 mx-auto">
                                    {displayAuthor.profile_picture ? (
                                        <AvatarImage
                                            src={displayAuthor.profile_picture}
                                            alt={displayAuthor.full_name}
                                            crossOrigin="anonymous"
                                        />
                                    ) : (
                                        <div className="bg-muted dark:bg-gray-700 border border-dashed border-gray-300 dark:border-gray-600 rounded-full w-full h-full flex items-center justify-center">
                                            <span className="text-2xl font-semibold text-muted-foreground dark:text-gray-400">{getInitials(displayAuthor.full_name || '')}</span>
                                        </div>
                                    )}
                                    <AvatarFallback className="text-2xl dark:bg-gray-700 dark:text-gray-400">{getInitials(displayAuthor.full_name || '')}</AvatarFallback>
                                </Avatar>

                                {/* Name */}
                                {isEditing ? (
                                    <div className="w-full space-y-1 mb-2">
                                        <Label htmlFor="full_name" className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name <span className="text-destructive">*</span></Label>
                                        <Input
                                            id="full_name"
                                            name="full_name"
                                            value={editedAuthor.full_name}
                                            onChange={handleInputChange}
                                            className={cn(
                                                "w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2",
                                                fieldErrors.full_name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500 dark:border-gray-600 dark:focus:ring-blue-400',
                                                "dark:bg-gray-700 dark:text-white",
                                                "transition-colors duration-200",
                                                "box-border text-center"
                                            )}
                                            aria-required="true"
                                            aria-invalid={!!fieldErrors.full_name}
                                            aria-describedby={fieldErrors.full_name ? 'full_name-error' : undefined}
                                        />
                                        {fieldErrors.full_name && (
                                            <p id="full_name-error" className="text-xs text-red-500 dark:text-red-400 mt-1">
                                                {fieldErrors.full_name}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <CardTitle className="text-2xl font-bold text-gray-800 dark:text-white">
                                        {displayAuthor.full_name}
                                    </CardTitle>
                                )}
                                {/* Affiliation */}
                                {isEditing ? (
                                    <div className="w-full space-y-1 mb-2">
                                        <Label htmlFor="affiliation" className="text-sm font-medium text-gray-700 dark:text-gray-300">Affiliation <span className="text-destructive">*</span></Label>
                                        <Input
                                            id="affiliation"
                                            name="affiliation"
                                            value={editedAuthor.affiliation}
                                            onChange={handleInputChange}
                                            className={cn(
                                                "w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2",
                                                fieldErrors.affiliation ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500 dark:border-gray-600 dark:focus:ring-blue-400",
                                                "dark:bg-gray-700 dark:text-white",
                                                "transition-colors duration-200",
                                                "box-border text-center"
                                            )}
                                            aria-required="true"
                                            aria-invalid={!!fieldErrors.affiliation}
                                            aria-describedby={fieldErrors.affiliation ? "affiliation-error" : undefined}
                                        />
                                        {fieldErrors.affiliation && (
                                            <p id="affiliation-error" className="text-xs text-red-500 dark:text-red-400 mt-1">
                                                {fieldErrors.affiliation}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <CardDescription className="text-gray-600 dark:text-gray-400">
                                        {displayAuthor.affiliation}
                                    </CardDescription>
                                )}
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                                {/* Department */}
                                {isEditing ? (
                                    <div className="w-full space-y-1 mb-4">
                                        <Label htmlFor="department" className="text-sm font-medium text-gray-700 dark:text-gray-300">Department <span className="text-destructive">*</span></Label>
                                        <Input
                                            id="department"
                                            name="department"
                                            value={editedAuthor.department}
                                            onChange={handleInputChange}
                                            className={cn(
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
                                        {fieldErrors.department && (
                                            <p id="department-error" className="text-xs text-red-500 dark:text-red-400 mt-1">
                                                {fieldErrors.department}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="mb-4 text-sm">
                                        <span className="font-semibold text-gray-700 dark:text-gray-300">Department: </span>
                                        <span className="text-gray-600 dark:text-gray-400">{displayAuthor.department}</span>
                                    </div>
                                )}

                                {/* Year of Graduation */}
                                {isEditing ? (
                                    <div className="w-full space-y-1 mb-4">
                                        <Label htmlFor="year_of_graduation" className="text-sm font-medium text-gray-700 dark:text-gray-300">Year of Graduation</Label>
                                        <Input
                                            id="year_of_graduation"
                                            name="year_of_graduation"
                                            value={editedAuthor.year_of_graduation || ''}
                                            onChange={handleInputChange}
                                            type="number" // Use number for better input control, handle parsing in save
                                            placeholder="e.g., 2010"
                                            className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-400 transition-colors duration-200"
                                        />
                                    </div>
                                ) : (
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
                                {/* Contact Information */}
                                <h3 className="text-base font-semibold mb-3 text-gray-800 dark:text-white">Contact</h3>
                                {isEditing ? (
                                    <div className="w-full space-y-1 mb-3">
                                        <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            value={editedAuthor.email || ''}
                                            onChange={handleInputChange}
                                            type="email"
                                            placeholder="e.g., name@example.com"
                                            className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-400 transition-colors duration-200"
                                        />
                                    </div>
                                ) : (
                                    displayAuthor.email && (
                                        <div className="mb-2 flex items-center text-sm">
                                            <Mail className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400 shrink-0" />
                                            <a href={`mailto:${displayAuthor.email}`} className="text-gray-600 dark:text-gray-400 hover:underline break-all">{displayAuthor.email}</a>
                                        </div>
                                    )
                                )}
                                {isEditing ? (
                                    <div className="w-full space-y-1 mb-3">
                                        <Label htmlFor="linkedin" className="text-sm font-medium text-gray-700 dark:text-gray-300">LinkedIn</Label>
                                        <Input
                                            id="linkedin"
                                            name="linkedin"
                                            value={editedAuthor.linkedin || ''}
                                            onChange={handleInputChange}
                                            type="url"
                                            placeholder="e.g., https://linkedin.com/in/..."
                                            className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-400 transition-colors duration-200"
                                        />
                                    </div>
                                ) : (
                                    displayAuthor.linkedin && (
                                        <div className="mb-2 flex items-center text-sm">
                                            <Linkedin className="mr-2 h-4 w-4 text-blue-500 shrink-0" />
                                            <a
                                                href={displayAuthor.linkedin}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:underline dark:text-blue-400 break-all"
                                            >
                                                {displayAuthor.linkedin.replace(/^https?:\/\/www\./, '')} {/* Shorten display URL */}
                                            </a>
                                        </div>
                                    )
                                )}

                                {isEditing ? (
                                    <div className="w-full space-y-1">
                                        <Label htmlFor="orcid_id" className="text-sm font-medium text-gray-700 dark:text-gray-300">ORCID ID</Label>
                                        <Input
                                            id="orcid_id"
                                            name="orcid_id"
                                            value={editedAuthor.orcid_id || ''}
                                            onChange={handleInputChange}
                                            type="text"
                                            placeholder="e.g., 0000-0000-0000-0000"
                                            className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-400 transition-colors duration-200"
                                        />
                                    </div>
                                ) : (
                                    displayAuthor.orcid_id && (
                                        <div className="flex items-center text-sm">
                                            {/* Simple ORCID-like icon */}
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
                    <motion.div
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <Card className="shadow-lg dark:bg-gray-800">
                            <CardHeader>
                                <CardTitle className="text-2xl font-bold text-gray-800 dark:text-white">Biography</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {isEditing ? (
                                    <div className="w-full space-y-1">
                                        <Label htmlFor="bio" className="text-sm font-medium text-gray-700 dark:text-gray-300">Biography</Label>
                                        <Textarea
                                            id="bio"
                                            name="bio"
                                            value={editedAuthor.bio || ''}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-400 transition-colors duration-200 min-h-[150px]"
                                            placeholder="Enter biography..."
                                        />
                                    </div>
                                ) : (
                                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line text-sm leading-relaxed">{displayAuthor.bio || 'No biography available.'}</p>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        className="mt-6"
                    >
                        <Card className="shadow-lg dark:bg-gray-800">
                            <CardHeader>
                                <CardTitle className="text-2xl font-bold text-gray-800 dark:text-white">Works ({displayAuthor.publications.length})</CardTitle>
                                <CardDescription className="text-gray-600 dark:text-gray-400">
                                    {isEditing
                                        ? "Edit publications below using valid JSON format."
                                        : "Browse or search the list of publications."
                                    }
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isEditing ? (
                                    <div className="w-full space-y-2">
                                        <Label htmlFor="publications" className="text-sm font-medium text-gray-700 dark:text-gray-300">Publications (JSON Array)</Label>
                                        <Textarea
                                            id="publications"
                                            name="publications"
                                            value={publicationsJson}
                                            onChange={handlePublicationsChange}
                                            className={cn(
                                                "w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2",
                                                "dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200 dark:focus:ring-blue-400",
                                                "transition-colors duration-200 min-h-[250px] font-mono text-xs leading-normal",
                                                jsonError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500 dark:border-gray-600'
                                            )}
                                            aria-invalid={!!jsonError}
                                            aria-describedby={jsonError ? 'publications-error' : undefined}
                                            spellCheck="false"
                                        />
                                        {jsonError && (
                                            <p id="publications-error" className="text-xs text-red-500 dark:text-red-400 mt-1">
                                                JSON Error: {jsonError}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <SearchResults
                                        publications={displayAuthor.publications}
                                        onSelectPublication={handlePublicationSelect}
                                        allTags={allTags}
                                    />
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>

            {/* Modal for displaying full publication details */}
            <AnimatePresence>
                {selectedPublication && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={handleCancel} // Close on overlay click
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="publication-modal-title"
                        aria-describedby="publication-modal-description"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 space-y-4"
                            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
                        >
                            <h2 id="publication-modal-title" className="text-2xl font-bold text-gray-900 dark:text-white">{selectedPublication.title}</h2>
                            <div id="publication-modal-description" className="space-y-3 text-sm">
                                <div className="text-gray-700 dark:text-gray-300">
                                    <span className="font-semibold">Category:</span> {selectedPublication.category}
                                </div>
                                <div className="text-gray-700 dark:text-gray-300">
                                    <span className="font-semibold">Year:</span> {selectedPublication.year}
                                </div>
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
                                            <LinkIcon className="ml-1 h-3 w-3 shrink-0" />
                                        </a>
                                    </div>
                                )}
                                {selectedPublication.tags.length > 0 && (
                                    <div className="text-gray-700 dark:text-gray-300">
                                        <span className="font-semibold">Tags:</span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {selectedPublication.tags.map(tag => (
                                                <span key={tag} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full inline-flex items-center">
                                                    <Tag className="w-3 h-3 mr-1" />
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end pt-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedPublication(null)}
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

export default AuthorProfilePage;
