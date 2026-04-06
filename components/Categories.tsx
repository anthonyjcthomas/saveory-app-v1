import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from "react-native";
import React, { useRef, useState } from 'react';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import dealCategories from '../data/dealCategories';

type Props = {
  onCategoryChanged: (category: string) => void;
  onSortByDistance?: () => void;
};

const Categories = ({ onCategoryChanged, onSortByDistance }: Props) => {
  const scrollRef = useRef<ScrollView>(null);
  const itemRef = useRef<TouchableOpacity[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleSelectCategory = (index: number) => {
    const selected = itemRef.current[index];
    setActiveIndex(index);
    selected?.measure((x, y, width, height, pageX, pageY) => {
      scrollRef.current?.scrollTo({ x: pageX - 20, y: 0, animated: true }); // Adjusted scroll position
    });

    const selectedCategory = dealCategories[index].title;
    console.log("Selected Category:", selectedCategory);

    if (selectedCategory === 'Nearest') {
      onSortByDistance();
    } else {
      onCategoryChanged(selectedCategory);
    }
  };

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
      >
        {dealCategories.map((item, index) => (
          <TouchableOpacity
            key={index}
            ref={(element) => {
              if (element) {
                itemRef.current[index] = element;
              }
            }}
            onPress={() => handleSelectCategory(index)}
            style={activeIndex === index ? styles.categoryBtnActive : styles.categoryBtn}
          >
            <MaterialCommunityIcons
              name={item.iconName as any}
              size={20}
              color={activeIndex === index ? '#ffffff' : '#264117'}
            />
            <Text style={activeIndex === index ? styles.categoryBtnTextActive : styles.categoryText}>
              {item.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default Categories;

const styles = StyleSheet.create({
  categoryText: {
    fontSize: 20,
    color: '#264117',
    marginTop: 0,
  },
  categoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: "#264117",
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    marginHorizontal: 4,
  },
  categoryBtnActive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#264117',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: "#264117",
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    marginHorizontal: 4,
  },
  categoryBtnTextActive: {
    fontSize: 20,
    color: '#ffffff',
    marginTop: 0,
  },
  categoryText: {
    fontSize: 20,
    color: '#264117',
    marginTop: 0,
  },
  categoriesContainer: {
    marginTop: 10,
    paddingHorizontal: 5,
    marginLeft: 3,
    marginBottom: 10,
  },
});
