'use client';

import React, { useCallback, useMemo } from 'react';
import { useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Trash2, PlusCircle, ImageIcon } from 'lucide-react';
import { QuestionImageUploader } from './question-image-uploader';

interface QuestionItemProps {
  control: any;
  qIndex: number;
  removeQuestion: (index: number) => void;
  form: any;
}

export const QuestionItem = React.memo(({ control, qIndex, removeQuestion, form }: QuestionItemProps) => {
  // Use field arrays for options and images
  const { fields: options, append: appendOption, remove: removeOption } = useFieldArray({
    control,
    name: `questions.${qIndex}.options`,
  });

  const { fields: images, append: appendImage, remove: removeImage } = useFieldArray({
    control,
    name: `questions.${qIndex}.images`,
  });

  // Watch only the necessary fields
  const questionType = form.watch(`questions.${qIndex}.type`);
  const isMultipleChoice = form.watch(`questions.${qIndex}.isMultipleChoice`);

  // Memoize handlers to prevent unnecessary re-renders
  const handleQuestionTypeChange = useCallback((value: string) => {
    console.log(`[QUESTION_ITEM] Type changed for Q${qIndex}:`, value);
    
    form.setValue(`questions.${qIndex}.type`, value, { shouldValidate: true });

    // Clear options when switching to IMAGE_BASED_ANSWER
    if (value === 'IMAGE_BASED_ANSWER') {
      form.setValue(`questions.${qIndex}.options`, []);
      
      // Ensure at least one image slot exists
      const currentImages = form.getValues(`questions.${qIndex}.images`) || [];
      if (currentImages.length === 0) {
        form.setValue(`questions.${qIndex}.images`, [{ url: '' }]);
      }
    } else if (value === 'MCQ') {
      // Ensure at least two options for MCQ
      const currentOptions = form.getValues(`questions.${qIndex}.options`) || [];
      if (currentOptions.length < 2) {
        form.setValue(`questions.${qIndex}.options`, [
          { text: '', isCorrect: true },
          { text: '', isCorrect: false }
        ]);
      }
      
      // Clear images when switching to MCQ
      form.setValue(`questions.${qIndex}.images`, []);
    }
  }, [qIndex, form]);

  const handleRemoveQuestion = useCallback(() => {
    removeQuestion(qIndex);
  }, [qIndex, removeQuestion]);

  const handleAppendOption = useCallback(() => {
    appendOption({ text: '', isCorrect: false });
  }, [appendOption]);

  const handleRemoveOption = useCallback((oIndex: number) => {
    // Ensure at least 2 options remain
    if (options.length > 2) {
      removeOption(oIndex);
    }
  }, [options.length, removeOption]);

  const handleAppendImage = useCallback(() => {
    appendImage({ url: '' });
  }, [appendImage]);

  const handleRemoveImage = useCallback((iIndex: number) => {
    removeImage(iIndex);
  }, [removeImage]);

  const handleMultipleChoiceChange = useCallback((checked: boolean) => {
    form.setValue(`questions.${qIndex}.isMultipleChoice`, checked);

    // If disabling multiple choice, keep only the first correct answer
    if (!checked) {
      let foundFirst = false;
      const currentOptions = form.getValues(`questions.${qIndex}.options`) || [];
      
      currentOptions.forEach((opt: any, oIndex: number) => {
        if (opt.isCorrect) {
          if (foundFirst) {
            form.setValue(`questions.${qIndex}.options.${oIndex}.isCorrect`, false);
          }
          foundFirst = true;
        }
      });
    }
  }, [qIndex, form]);

  const handleOptionCorrectChange = useCallback((oIndex: number, checked: boolean) => {
    // If single choice mode, uncheck all other options
    if (!isMultipleChoice && checked) {
      const currentOptions = form.getValues(`questions.${qIndex}.options`) || [];
      currentOptions.forEach((_: any, idx: number) => {
        if (idx !== oIndex) {
          form.setValue(`questions.${qIndex}.options.${idx}.isCorrect`, false);
        }
      });
    }
    
    form.setValue(`questions.${qIndex}.options.${oIndex}.isCorrect`, checked);
  }, [isMultipleChoice, qIndex, form]);

  // Memoize the rendered content to reduce re-renders
  const optionsContent = useMemo(() => (
    <>
      <FormField
        control={control}
        name={`questions.${qIndex}.isMultipleChoice`}
        render={({ field }) => (
          <FormItem className="flex flex-row items-center space-x-3 space-y-0 mt-4">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={handleMultipleChoiceChange}
              />
            </FormControl>
            <FormLabel className="text-sm font-normal">
              Allow multiple correct answers
            </FormLabel>
          </FormItem>
        )}
      />

      <h4 className="font-semibold text-sm mt-4">Options</h4>
      <div className="space-y-3">
        {options.map((option, oIndex) => (
          <div key={option.id} className="flex items-center gap-2">
            <FormField
              control={control}
              name={`questions.${qIndex}.options.${oIndex}.isCorrect`}
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => handleOptionCorrectChange(oIndex, !!checked)}
                    />
                  </FormControl>
                  <FormLabel className="text-sm font-normal pt-1">Correct</FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`questions.${qIndex}.options.${oIndex}.text`}
              render={({ field }) => (
                <FormItem className="flex-grow">
                  <FormControl>
                    <Input placeholder={`Option ${oIndex + 1}`} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleRemoveOption(oIndex)}
              disabled={options.length <= 2}
            >
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-2"
        onClick={handleAppendOption}
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        Add Option
      </Button>
    </>
  ), [options, control, qIndex, handleMultipleChoiceChange, handleOptionCorrectChange, handleRemoveOption, handleAppendOption]);

  const imagesContent = useMemo(() => (
    <>
      <h4 className="font-semibold text-sm">Images for Question</h4>
      <div className="space-y-3">
        {images.map((image, iIndex) => (
          <div key={image.id || iIndex} className="flex items-center gap-2">
            <QuestionImageUploader qIndex={qIndex} iIndex={iIndex} form={form} />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleRemoveImage(iIndex)}
              disabled={images.length <= 1}
            >
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-2"
        onClick={handleAppendImage}
      >
        <ImageIcon className="mr-2 h-4 w-4" />
        Add Image
      </Button>
    </>
  ), [images, qIndex, form, handleRemoveImage, handleAppendImage]);

  return (
    <Card className="mb-6 border-dashed">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Question {qIndex + 1}</CardTitle>
        <Button
          type="button"
          variant="destructive"
          size="icon"
          onClick={handleRemoveQuestion}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <FormField
              control={control}
              name={`questions.${qIndex}.text`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question Text</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., What was the spinning top's purpose?"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="md:col-span-1">
            <FormField
              control={control}
              name={`questions.${qIndex}.type`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question Type</FormLabel>
                  <Select
                    onValueChange={handleQuestionTypeChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="MCQ">Multiple Choice</SelectItem>
                      <SelectItem value="IMAGE_BASED_ANSWER">Image-Based Answer</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="md:col-span-1">
            <FormField
              control={control}
              name={`questions.${qIndex}.points`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Points</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="10" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator className="my-4" />

        {questionType === 'MCQ' ? optionsContent : imagesContent}
      </CardContent>
    </Card>
  );
});

QuestionItem.displayName = 'QuestionItem';