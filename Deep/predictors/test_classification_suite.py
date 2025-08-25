#!/usr/bin/env python3
"""
Comprehensive 10K Classification Test Suite
Generates diverse offer and order examples to test and improve classification accuracy
"""

import json
import random
from predict_roberta_perfect import PerfectClassifier

class ClassificationTestSuite:
    def __init__(self):
        self.classifier = PerfectClassifier()
        
        # Expanded product categories
        self.products = [
            'birkin', 'kelly', 'constance', 'bag', 'handbag', 'purse', 'clutch',
            'tote', 'shoulder bag', 'crossbody', 'backpack', 'wallet', 'belt',
            'scarf', 'shoes', 'sandals', 'sneakers', 'boots', 'watch', 'jewelry',
            'bracelet', 'necklace', 'earrings', 'ring', 'sunglasses', 'perfume',
            'lipstick', 'makeup', 'skincare', 'dress', 'shirt', 'jacket', 'coat'
        ]
        
        # Luxury brands
        self.brands = [
            'hermes', 'chanel', 'louis vuitton', 'gucci', 'prada', 'dior',
            'bottega veneta', 'saint laurent', 'balenciaga', 'celine', 'fendi',
            'versace', 'givenchy', 'valentino', 'cartier', 'rolex', 'tiffany'
        ]
        
        # Colors with variations and misspellings
        self.colors = [
            'black', 'white', 'red', 'blue', 'green', 'yellow', 'pink', 'purple',
            'orange', 'brown', 'gray', 'grey', 'gold', 'silver', 'rose gold',
            'etoupe', 'etoup', 'etoupe', 'noir', 'blanc', 'rouge', 'bleu',
            'vert', 'jaune', 'rose', 'violet', 'orange', 'marron', 'gris',
            'navy', 'beige', 'cream', 'ivory', 'burgundy', 'emerald', 'sapphire'
        ]
        
        # Sizes and specifications
        self.sizes = [
            '25', '30', '35', '40', '20', '28', '32', '18', '24', '29',
            'mini', 'small', 'medium', 'large', 'xl', 'xxl', 'one size'
        ]
        
        # Materials and leather types
        self.materials = [
            'epsom', 'togo', 'swift', 'clemence', 'box', 'chevre', 'ostrich',
            'crocodile', 'alligator', 'lizard', 'snake', 'canvas', 'leather',
            'suede', 'patent', 'matte', 'shiny', 'textured', 'smooth'
        ]
        
        # Hardware types
        self.hardware = [
            'gold hardware', 'silver hardware', 'palladium hardware',
            'rose gold hardware', 'ghw', 'shw', 'phw', 'rhw', 'brushed',
            'polished', 'matte hardware'
        ]
        
        # Price ranges and formats
        self.price_formats = [
            '${}', '${},000', '{}k', '{}.5k', '€{}', '£{}', '¥{}',
            'price: ${}', 'cost: ${}', 'asking ${}', '${} obo',
            '{} dollars', '{} euros', '{} pounds'
        ]
        
    def generate_order_examples(self, count=5000):
        """Generate diverse order examples"""
        orders = []
        
        # Order intent words
        order_intents = [
            'want', 'need', 'looking for', 'searching for', 'interested in',
            'seeking', 'hunting for', 'in search of', 'would like', 'desire',
            'require', 'must have', 'hoping to find', 'trying to find',
            'on the hunt for', 'desperately need', 'urgently need'
        ]
        
        # Budget/price expressions
        budget_expressions = [
            'budget', 'price range', 'willing to pay', 'can spend',
            'looking to spend', 'budget of', 'price limit', 'max budget',
            'spending limit', 'can afford', 'price point', 'cost range'
        ]
        
        for i in range(count):
            # Generate different types of orders
            order_type = random.choice([
                'simple_want', 'specific_product', 'with_budget', 'with_specs',
                'urgent', 'casual', 'detailed', 'brand_specific'
            ])
            
            if order_type == 'simple_want':
                intent = random.choice(order_intents)
                product = random.choice(self.products)
                order = f"{intent} {product}"
                
            elif order_type == 'specific_product':
                intent = random.choice(order_intents)
                brand = random.choice(self.brands)
                product = random.choice(self.products)
                order = f"{intent} {brand} {product}"
                
            elif order_type == 'with_budget':
                intent = random.choice(order_intents)
                product = random.choice(self.products)
                budget_expr = random.choice(budget_expressions)
                price = random.randint(100, 50000)
                price_format = random.choice(self.price_formats)
                formatted_price = price_format.format(price)
                order = f"{intent} {product} with {budget_expr} {formatted_price}"
                
            elif order_type == 'with_specs':
                intent = random.choice(order_intents)
                product = random.choice(self.products)
                color = random.choice(self.colors)
                size = random.choice(self.sizes)
                order = f"{intent} {color} {product} size {size}"
                
            elif order_type == 'urgent':
                urgency = random.choice(['urgently', 'desperately', 'immediately', 'asap'])
                intent = random.choice(order_intents)
                product = random.choice(self.products)
                order = f"{urgency} {intent} {product}"
                
            elif order_type == 'casual':
                casual_start = random.choice(['hi', 'hello', 'hey', 'good morning', 'good evening'])
                intent = random.choice(order_intents)
                product = random.choice(self.products)
                order = f"{casual_start}, {intent} {product}"
                
            elif order_type == 'detailed':
                intent = random.choice(order_intents)
                brand = random.choice(self.brands)
                product = random.choice(self.products)
                color = random.choice(self.colors)
                material = random.choice(self.materials)
                hardware = random.choice(self.hardware)
                order = f"{intent} {brand} {product} in {color} {material} with {hardware}"
                
            elif order_type == 'brand_specific':
                intent = random.choice(order_intents)
                brand = random.choice(self.brands)
                product = random.choice(self.products)
                size = random.choice(self.sizes)
                order = f"{intent} {brand} {product} {size}"
            
            # Add variations and natural language elements
            variations = [
                lambda x: x + ".",
                lambda x: x + "!",
                lambda x: x + "?",
                lambda x: x + " please",
                lambda x: x + " thanks",
                lambda x: "do you have " + x + "?",
                lambda x: "anyone selling " + x + "?",
                lambda x: "iso " + x,  # in search of
                lambda x: "wtb " + x,  # want to buy
            ]
            
            if random.random() < 0.3:  # 30% chance of variation
                variation = random.choice(variations)
                order = variation(order)
            
            orders.append({
                'text': order,
                'expected': 'Order',
                'type': order_type
            })
            
        return orders
    
    def generate_offer_examples(self, count=5000):
        """Generate diverse offer examples"""
        offers = []
        
        # Offer intent words
        offer_intents = [
            'selling', 'for sale', 'available', 'have', 'offering', 'fs',
            'listing', 'selling fast', 'must sell', 'quick sale', 'urgent sale',
            'letting go', 'parting with', 'moving sale', 'collection sale'
        ]
        
        # Condition descriptions
        conditions = [
            'brand new', 'new with tags', 'never used', 'pristine condition',
            'excellent condition', 'very good condition', 'good condition',
            'preloved', 'gently used', 'hardly used', 'minimal wear',
            'authentic', 'genuine', 'original', 'with receipt', 'with box',
            'with dust bag', 'complete set', 'full packaging'
        ]
        
        # Sale urgency
        urgency_words = [
            'urgent', 'quick sale', 'must go', 'moving sale', 'need gone',
            'price drop', 'reduced price', 'final price', 'no lowballers',
            'serious buyers only', 'cash only', 'pickup only'
        ]
        
        for i in range(count):
            # Generate different types of offers
            offer_type = random.choice([
                'simple_sale', 'with_price', 'with_condition', 'with_specs',
                'urgent_sale', 'detailed', 'authentic_claim', 'bundle_deal'
            ])
            
            if offer_type == 'simple_sale':
                intent = random.choice(offer_intents)
                product = random.choice(self.products)
                offer = f"{intent} {product}"
                
            elif offer_type == 'with_price':
                intent = random.choice(offer_intents)
                product = random.choice(self.products)
                price = random.randint(100, 50000)
                price_format = random.choice(self.price_formats)
                formatted_price = price_format.format(price)
                offer = f"{intent} {product} {formatted_price}"
                
            elif offer_type == 'with_condition':
                intent = random.choice(offer_intents)
                condition = random.choice(conditions)
                product = random.choice(self.products)
                offer = f"{intent} {condition} {product}"
                
            elif offer_type == 'with_specs':
                intent = random.choice(offer_intents)
                brand = random.choice(self.brands)
                product = random.choice(self.products)
                color = random.choice(self.colors)
                size = random.choice(self.sizes)
                offer = f"{intent} {brand} {product} {color} size {size}"
                
            elif offer_type == 'urgent_sale':
                urgency = random.choice(urgency_words)
                intent = random.choice(offer_intents)
                product = random.choice(self.products)
                price = random.randint(100, 50000)
                price_format = random.choice(self.price_formats)
                formatted_price = price_format.format(price)
                offer = f"{urgency} {intent} {product} {formatted_price}"
                
            elif offer_type == 'detailed':
                intent = random.choice(offer_intents)
                brand = random.choice(self.brands)
                product = random.choice(self.products)
                color = random.choice(self.colors)
                material = random.choice(self.materials)
                condition = random.choice(conditions)
                price = random.randint(100, 50000)
                price_format = random.choice(self.price_formats)
                formatted_price = price_format.format(price)
                offer = f"{intent} {condition} {brand} {product} in {color} {material} {formatted_price}"
                
            elif offer_type == 'authentic_claim':
                auth_claim = random.choice(['authentic', 'genuine', 'original', '100% authentic'])
                brand = random.choice(self.brands)
                product = random.choice(self.products)
                intent = random.choice(offer_intents)
                offer = f"{intent} {auth_claim} {brand} {product}"
                
            elif offer_type == 'bundle_deal':
                intent = random.choice(offer_intents)
                product1 = random.choice(self.products)
                product2 = random.choice(self.products)
                price = random.randint(200, 80000)
                price_format = random.choice(self.price_formats)
                formatted_price = price_format.format(price)
                offer = f"{intent} {product1} and {product2} bundle {formatted_price}"
            
            # Add variations
            variations = [
                lambda x: x + ".",
                lambda x: x + "!",
                lambda x: x + " dm me",
                lambda x: x + " serious buyers only",
                lambda x: x + " no lowballers",
                lambda x: x + " cash ready",
                lambda x: x + " pickup available",
                lambda x: x + " shipping worldwide",
            ]
            
            if random.random() < 0.3:  # 30% chance of variation
                variation = random.choice(variations)
                offer = variation(offer)
            
            offers.append({
                'text': offer,
                'expected': 'Offer',
                'type': offer_type
            })
            
        return offers
    
    def run_classification_test(self, test_data):
        """Run classification test on provided data"""
        results = {
            'total': len(test_data),
            'correct': 0,
            'incorrect': 0,
            'accuracy': 0.0,
            'misclassified': [],
            'pattern_gaps': {
                'order_missed': [],
                'offer_missed': [],
                'unknown_classified': []
            }
        }
        
        for item in test_data:
            predicted = self.classifier.classify(item['text'])
            expected = item['expected']
            
            if predicted == expected:
                results['correct'] += 1
            else:
                results['incorrect'] += 1
                results['misclassified'].append({
                    'text': item['text'],
                    'expected': expected,
                    'predicted': predicted,
                    'type': item.get('type', 'unknown')
                })
                
                # Track pattern gaps
                if expected == 'Order' and predicted != 'Order':
                    results['pattern_gaps']['order_missed'].append(item['text'])
                elif expected == 'Offer' and predicted != 'Offer':
                    results['pattern_gaps']['offer_missed'].append(item['text'])
                elif predicted == 'unknown':
                    results['pattern_gaps']['unknown_classified'].append(item['text'])
        
        results['accuracy'] = (results['correct'] / results['total']) * 100
        return results
    
    def analyze_missing_patterns(self, results):
        """Analyze misclassified examples to identify missing patterns"""
        analysis = {
            'missing_order_keywords': set(),
            'missing_offer_keywords': set(),
            'suggested_patterns': []
        }
        
        # Analyze missed orders
        for text in results['pattern_gaps']['order_missed']:
            words = text.lower().split()
            # Look for potential order keywords
            order_indicators = ['want', 'need', 'looking', 'searching', 'seeking', 
                              'interested', 'hunting', 'require', 'desire', 'iso', 'wtb']
            for word in words:
                if any(indicator in word for indicator in order_indicators):
                    analysis['missing_order_keywords'].add(word)
        
        # Analyze missed offers
        for text in results['pattern_gaps']['offer_missed']:
            words = text.lower().split()
            # Look for potential offer keywords
            offer_indicators = ['selling', 'sale', 'available', 'have', 'offering', 
                              'listing', 'fs', 'authentic', 'genuine', 'condition']
            for word in words:
                if any(indicator in word for indicator in offer_indicators):
                    analysis['missing_offer_keywords'].add(word)
        
        return analysis
    
    def generate_pattern_suggestions(self, analysis):
        """Generate regex pattern suggestions based on analysis"""
        suggestions = []
        
        # Order pattern suggestions
        if analysis['missing_order_keywords']:
            order_keywords = '|'.join(analysis['missing_order_keywords'])
            suggestions.append(f"Order pattern: r'\\b({order_keywords})\\b'")
        
        # Offer pattern suggestions
        if analysis['missing_offer_keywords']:
            offer_keywords = '|'.join(analysis['missing_offer_keywords'])
            suggestions.append(f"Offer pattern: r'\\b({offer_keywords})\\b'")
        
        return suggestions
    
    def run_full_test_suite(self):
        """Run the complete 10K test suite"""
        print("Generating 10K classification test suite...")
        
        # Generate test data
        orders = self.generate_order_examples(5000)
        offers = self.generate_offer_examples(5000)
        
        # Combine and shuffle
        all_tests = orders + offers
        random.shuffle(all_tests)
        
        print(f"Generated {len(all_tests)} test examples")
        print(f"Orders: {len(orders)}, Offers: {len(offers)}")
        
        # Run classification test
        print("\nRunning classification tests...")
        results = self.run_classification_test(all_tests)
        
        # Print results
        print(f"\n=== CLASSIFICATION RESULTS ===")
        print(f"Total tests: {results['total']}")
        print(f"Correct: {results['correct']}")
        print(f"Incorrect: {results['incorrect']}")
        print(f"Accuracy: {results['accuracy']:.2f}%")
        
        # Analyze patterns
        analysis = self.analyze_missing_patterns(results)
        
        print(f"\n=== PATTERN ANALYSIS ===")
        print(f"Order patterns missed: {len(results['pattern_gaps']['order_missed'])}")
        print(f"Offer patterns missed: {len(results['pattern_gaps']['offer_missed'])}")
        print(f"Unknown classifications: {len(results['pattern_gaps']['unknown_classified'])}")
        
        # Show some examples of misclassified items
        print(f"\n=== SAMPLE MISCLASSIFICATIONS ===")
        for i, item in enumerate(results['misclassified'][:10]):
            print(f"{i+1}. '{item['text']}' -> Expected: {item['expected']}, Got: {item['predicted']}")
        
        # Generate suggestions
        suggestions = self.generate_pattern_suggestions(analysis)
        if suggestions:
            print(f"\n=== PATTERN SUGGESTIONS ===")
            for suggestion in suggestions:
                print(f"- {suggestion}")
        
        # Save detailed results
        with open('/root/whatsapp-bot_v2/Deep/predictors/test_results.json', 'w') as f:
            json.dump({
                'results': results,
                'analysis': {
                    'missing_order_keywords': list(analysis['missing_order_keywords']),
                    'missing_offer_keywords': list(analysis['missing_offer_keywords'])
                },
                'suggestions': suggestions
            }, f, indent=2)
        
        print(f"\nDetailed results saved to test_results.json")
        return results, analysis

if __name__ == "__main__":
    suite = ClassificationTestSuite()
    results, analysis = suite.run_full_test_suite()