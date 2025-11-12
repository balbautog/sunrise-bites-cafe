-- Insert sample data for Sunrise Bites Cafe

-- Insert categories
INSERT INTO categories (name, description, image_url) VALUES
('Breakfast Classics', 'Traditional breakfast favorites to start your day right', '/images/classics.jpg'),
('Healthy Choices', 'Light and nutritious options for a healthy morning', '/images/healthy.jpg'),
('Sweet Treats', 'Indulgent pancakes, waffles and French toast', '/images/sweets.jpg'),
('Beverages', 'Coffee, tea, and refreshing drinks', '/images/beverages.jpg'),
('Sides & Extras', 'Perfect additions to complete your meal', '/images/sides.jpg');

-- Insert menu items
INSERT INTO menu_items (name, description, price, category_id, preparation_time) VALUES
-- Breakfast Classics
('Sunrise Classic', 'Two eggs any style, bacon, toast, and home fries', 12.99, 1, 10),
('Farmers Omelette', 'Three-egg omelette with ham, cheese, peppers, and onions', 14.99, 1, 12),
('Breakfast Burrito', 'Scrambled eggs, sausage, cheese, and potatoes wrapped in a flour tortilla', 11.99, 1, 8),
('Steak & Eggs', '6oz sirloin steak with two eggs and breakfast potatoes', 18.99, 1, 15),

-- Healthy Choices
('Avocado Toast', 'Smashed avocado on artisan bread with cherry tomatoes and microgreens', 9.99, 2, 5),
('Greek Yogurt Bowl', 'Greek yogurt with granola, honey, and fresh berries', 8.99, 2, 3),
('Vegetable Scramble', 'Egg whites scrambled with seasonal vegetables', 10.99, 2, 7),
'Oatmeal Deluxe', 'Steel-cut oatmeal with brown sugar, nuts, and dried fruits', 7.99, 2, 4),

-- Sweet Treats
('Pancake Stack', 'Three fluffy buttermilk pancakes with maple syrup', 8.99, 3, 8),
('Belgian Waffle', 'Crispy Belgian waffle with whipped cream and berries', 9.99, 3, 10),
('French Toast', 'Thick-cut brioche French toast with cinnamon and powdered sugar', 9.49, 3, 8),
('Cinnamon Rolls', 'Freshly baked cinnamon rolls with cream cheese frosting', 6.99, 3, 5),

-- Beverages
('Fresh Brewed Coffee', 'Our signature blend, bottomless cup', 2.99, 4, 2),
('Orange Juice', 'Freshly squeezed orange juice', 3.99, 4, 1),
('Smoothie of the Day', 'Seasonal fruit smoothie', 5.99, 4, 4),
('Iced Latte', 'Chilled espresso with milk and your choice of syrup', 4.99, 4, 3),

-- Sides & Extras
('Side of Bacon', 'Crispy smoked bacon', 3.99, 5, 6),
('Side of Sausage', 'Two breakfast sausage links', 3.49, 5, 6),
('Toast & Jam', 'Two slices of toast with assorted jams', 2.99, 5, 3),
('Fresh Fruit Cup', 'Seasonal fresh fruit assortment', 4.99, 5, 2);

-- Insert staff members
INSERT INTO staff (staff_id, password_hash, full_name, role) VALUES
('SB001', '$2b$10$examplehash1', 'John Smith', 'chef'),
('SB002', '$2b$10$examplehash2', 'Maria Garcia', 'server'),
('SB003', '$2b$10$examplehash3', 'David Johnson', 'manager');

-- Insert admin user
INSERT INTO admins (username, password_hash, full_name) VALUES
('admin', '$2b$10$adminhash123', 'System Administrator');

-- Insert sample customer
INSERT INTO users (email, password_hash, full_name, phone) VALUES
('customer@example.com', '$2b$10$customerhash', 'Jane Doe', '+1234567890');